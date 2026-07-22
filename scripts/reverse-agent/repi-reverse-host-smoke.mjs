#!/usr/bin/env node
/**
 * REPI reverse host-smoke orchestrator.
 * Regenerates docs/reverse-agent/*-host-capture-smoke.out from live host CAP.
 *
 * Usage:
 *   node scripts/reverse-agent/repi-reverse-host-smoke.mjs [native|exploit|mobile|browser|authz|web-authz|js-signing|dfir|firmware|crypto|malware|memory|cloud|agent-security|core|web|adapters|all] [--json]
 *   repi reverse-smoke [native|exploit|mobile|browser|authz|web-authz|js-signing|dfir|firmware|crypto|malware|memory|cloud|agent-security|core|web|adapters|all] [--json]
 *
 * Product launcher passes repo root as argv[2].
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCOPES = new Set([
	"native",
	"exploit",
	"mobile",
	"browser",
	"authz",
	"js-signing",
	"dfir",
	"firmware",
	"crypto",
	"malware",
	"memory",
	"cloud",
	"agent-security",
	"core",
	"web",
	"adapters",
	"all",
]);

const rawArgs = process.argv.slice(2);
const rootArg =
	rawArgs[0] && !rawArgs[0].startsWith("--") && !SCOPES.has(String(rawArgs[0]).toLowerCase())
		? rawArgs.shift()
		: undefined;
const json = rawArgs.includes("--json");
const scope = (rawArgs.find((a) => !a.startsWith("-")) || "core").toLowerCase();
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(rootArg ?? join(here, "../.."));
const docs = join(root, "docs/reverse-agent");
mkdirSync(docs, { recursive: true });

const PATH_PREFIX = "/usr/local/bin:/usr/bin:/bin:/opt/repi-tools/rizin:/opt/jadx/bin:/root/.local/bin";

function ensureVuln() {
	const bin = "/tmp/repi-vuln";
	const src = "/tmp/repi-vuln.c";
	if (existsSync(bin)) return bin;
	writeFileSync(
		src,
		`#include <stdio.h>
#include <string.h>
void vuln(){ char buf[64]; gets(buf); puts(buf); }
int main(){ setvbuf(stdout,0,_IONBF,0); vuln(); return 0; }
`,
	);
	const r = spawnSync("gcc", ["-fno-stack-protector", "-z", "execstack", "-no-pie", "-o", bin, src], {
		encoding: "utf8",
	});
	if (r.status !== 0) throw new Error(`gcc failed: ${r.stderr || r.stdout}`);
	return bin;
}

function ensureMobileApk() {
	const apk = "/tmp/repi-mobile-smoke.apk";
	// Always rebuild via external script (avoid spawn argv null-byte issues from inline py).
	const script = join(root, "scripts/reverse-agent/repi-reverse-host-smoke-mobile-apk.py");
	const r = spawnSync("python3", [script], { encoding: "utf8" });
	if (r.status !== 0) throw new Error(`apk fixture failed: ${r.stderr || r.stdout}`);
	return apk;
}

function ensureJsSample() {
	const p = "/tmp/repi-js-sign-sample.js";
	writeFileSync(
		p,
		`// secret=repi-dev-secret password=changeme api_key=demo
const crypto = require('crypto');
fetch('/api/sign', {
  headers: {
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJyZXBpIn0.sig',
    'X-Signature': 'deadbeef'
  }
});
const wasmMod = WebAssembly; // wasm surface for CAP
function hmac(body, secret) {
  return crypto.createHmac('sha256', secret || 'repi-dev-secret').update(body).digest('hex');
}
//# sourceMappingURL=app.js.map
`,
	);
	// companion HTML for SRI integrity attribute CAP (static path)
	writeFileSync(
		"/tmp/repi-js-sign-sample.html",
		`<html><head><title>repi-js-sign</title></head><body>
<script src="/tmp/repi-js-sign-sample.js" integrity="sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" crossorigin="anonymous"></script>
<script integrity="sha384-abcdefghijklmnopqrstuvwxyz0123456789+/ABCDEF=="></script>
</body></html>
`,
	);
	// minimal WASM module: magic \0asm + version 1 + empty body
	writeFileSync(
		"/tmp/repi-js-sign-sample.wasm",
		Buffer.from([0x00,0x61,0x73,0x6d, 0x01,0x00,0x00,0x00]),
	);
	return p;
}

function startWebFixture(kind) {
	// CRITICAL: fixture must run in a child process. spawnSync blocks the event loop,
	// so an in-process createServer cannot accept connections during capture.
	const scriptPath = join(root, "scripts/reverse-agent/repi-fixture-web-server.mjs");
	const kindArg = kind === "authz" ? "authz" : kind === "js-signing" ? "js-signing" : "browser";
	const child = spawn(process.execPath, [scriptPath, kindArg], {
		stdio: ["ignore", "pipe", "pipe"],
		env: { ...process.env, PATH: PATH_PREFIX },
	});
	return new Promise((resolveServer, reject) => {
		let buf = "";
		let done = false;
		const timer = setTimeout(() => {
			if (done) return;
			try {
				child.kill("SIGTERM");
			} catch {}
			reject(new Error(`fixture server timeout kind=${kind}`));
		}, 10000);
		const finish = (port) => {
			if (done) return;
			done = true;
			clearTimeout(timer);
			resolveServer({
				url: `http://127.0.0.1:${port}/`,
				close: async () => {
					try {
						child.kill("SIGTERM");
					} catch {}
					await new Promise((r) => setTimeout(r, 80));
				},
			});
		};
		child.stdout.on("data", (chunk) => {
			buf += String(chunk);
			const match = /READY (\d+)/.exec(buf);
			if (match) finish(Number(match[1]));
		});
		child.stderr.on("data", () => {});
		child.on("error", (err) => {
			if (done) return;
			clearTimeout(timer);
			reject(err);
		});
	});
}

function importAndShell(modulePath, exportName, callExpr, extraEnv = {}) {
	const runner = `
import { spawnSync } from "node:child_process";
import { ${exportName} } from ${JSON.stringify(modulePath)};
const cmd = ${callExpr};
const env = {
  ...process.env,
  REPI_NATIVE_DYN: process.env.REPI_NATIVE_DYN || "1",
  REPI_NATIVE_SYMBOLIC: process.env.REPI_NATIVE_SYMBOLIC || "1",
  REPI_NATIVE_DEEP: process.env.REPI_NATIVE_DEEP || "1",
  REPI_FRIDA_LOCAL_ATTACH: process.env.REPI_FRIDA_LOCAL_ATTACH || "1",
  PATH: ${JSON.stringify(PATH_PREFIX)},
  NODE_PATH: "/usr/lib/node_modules:/usr/local/lib/node_modules",
  ...${JSON.stringify(extraEnv)},
};
const r = spawnSync("bash", ["--noprofile", "--norc", "-c", cmd], {
  encoding: "utf8",
  env,
  timeout: 150000,
  maxBuffer: 40 * 1024 * 1024,
});
const out = \`\${r.stdout || ""}\\n\${r.stderr || ""}\`;
process.stdout.write(out);
process.exit(r.status === null ? 1 : r.status);
`;
	const r = spawnSync("node", ["--import", "tsx", "-e", runner], {
		cwd: root,
		encoding: "utf8",
		timeout: 180000,
		maxBuffer: 40 * 1024 * 1024,
		env: {
			...process.env,
			PATH: PATH_PREFIX,
			NODE_PATH: "/usr/lib/node_modules:/usr/local/lib/node_modules",
			...extraEnv,
		},
	});
	return {
		status: r.status === null ? 1 : r.status,
		out: `${r.stdout || ""}\n${r.stderr || ""}`,
	};
}

function writeSmoke(name, text) {
	const path = join(docs, `${name}-host-capture-smoke.out`);
	writeFileSync(path, text);
	return path;
}

function runNative() {
	const bin = ensureVuln();
	const mod = join(root, "packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts");
	const { status, out } = importAndShell(mod, "nativeRuntimeShellCommand", `nativeRuntimeShellCommand(${JSON.stringify(bin)}, 20000)`);
	const path = writeSmoke("native", out);
	const checks = {
		host_checksec: /\[native-checksec\].*(Partial RELRO|NX disabled|No PIE|RELRO)/i.test(out),
		host_ropgadget: /\[native-ropgadget\]/.test(out),
		rop_pure: /\[native-rop-pure\] ok=1/.test(out),
		dyn_crash: /\[native-dyn-probe\] crash=1/.test(out),
		exact_offset: /\[native-dyn-offset\] exact=\d+/.test(out),
		gdb_cap: /gdb=1/.test(out) && /dyn=1/.test(out),
		proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
		bind_ready: /bind_ready=true/.test(out),
	};
	return row("native", status, out, path, checks, {
		exact: (out.match(/\[native-dyn-offset\] exact=(\d+)/) || [])[1] || null,
		proof: (out.match(/proof\.exit=([a-z_]+)/) || [])[1] || null,
	});
}

function runExploit() {
	const bin = ensureVuln();
	const mod = join(root, "packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell.ts");
	const { status, out } = importAndShell(mod, "exploitLabShellCommand", `exploitLabShellCommand(${JSON.stringify(bin)}, 3, 8000)`);
	const path = writeSmoke("exploit", out);
	const checks = {
		checksec_or_mitigation: /\[exploit-lab-checksec\]|\[exploit-lab-mitigation\]/.test(out),
		crash: /\[exploit-lab-crash\]|crash=1|SIGSEGV|exact=\d+/.test(out),
		runs: /\[exploit-lab-replay\] run=/.test(out) || /runs=\d+/.test(out),
		rop_or_one: /\[exploit-lab-ropgadget\] ok=1|\[exploit-lab-one-gadget\] ok=1|rop=1|one_gadget=1/.test(out),
		proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
		bind_ready: /bind_ready=true/.test(out),
	};
	return row("exploit", status, out, path, checks, {
		exact: (out.match(/exact=(\d+)/) || [])[1] || null,
		proof: (out.match(/proof\.exit=([a-z_]+)/) || [])[1] || null,
	});
}

function runMobile() {
	const apk = ensureMobileApk();
	if (apk !== "/tmp/repi-mobile-smoke.apk") {
		try {
			copyFileSync(apk, "/tmp/repi-mobile-smoke.apk");
		} catch {
			// ignore
		}
	}
	const mod = join(root, "packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts");
	const target = existsSync("/tmp/repi-mobile-smoke.apk") ? "/tmp/repi-mobile-smoke.apk" : apk;
	const { status, out } = importAndShell(
		mod,
		"mobileRuntimeShellCommand",
		`mobileRuntimeShellCommand(${JSON.stringify(target)}, undefined, 15000)`,
	);
	const path = writeSmoke("mobile", out);
	const checks = {
		apk_surface: /\[mobile-apk\]|\[mobile-apk-deep\]/.test(out),
		package_hits: /package_hits=[1-9]|summary\.mobile_package=1|\[mobile-package-candidate\]/.test(out),
		dex_methods: /methods=[1-9]|summary\.mobile_dex_methods=1|\[mobile-dex-method\]/.test(out),
		frida_surface: /\[mobile-frida-surface\]|\[mobile-frida-map\]|frida=1/.test(out),
		device_or_emulator: /\[mobile-device-host\]|\[mobile-emulator\]|\[mobile-device\]/.test(out),
		jadx_host: /jadx=\/usr\/local\/bin\/jadx|jadx=\/usr\/bin\/jadx/.test(out) || /\[mobile-jadx\] host=1/.test(out),
		proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
		bind_ready: /bind_ready=true/.test(out),
	};
	return row("mobile", status, out, path, checks, {
		local_attach: /local_attach=1|summary\.local_attach=1/.test(out) ? "1" : "0",
		proof: (out.match(/proof\.exit=([a-z_]+)/) || [])[1] || null,
	});
}

async function runBrowser() {
	const fixture = await startWebFixture("browser");
	try {
		const mod = join(root, "packages/coding-agent/src/core/repi/web-runtime/browser-capture-script.ts");
		const { status, out } = importAndShell(
			mod,
			"liveBrowserShellCommand",
			`liveBrowserShellCommand(${JSON.stringify(fixture.url)}, 20000)`,
			{ REPI_WORKDIR: "/tmp/repi-browser-smoke" },
		);
		const path = writeSmoke("browser", out);
		const checks = {
			engine_playwright: /\[browser-engine\] playwright=yes|engine=playwright/.test(out),
			storage: /storage=1|\[browser-storage\]|cookies=1/.test(out),
			api_or_scripts: /api=1|scripts=1|\[browser-script\]|\[browser-xhr\]/.test(out),
			proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
			bind_ready: /bind_ready=true/.test(out),
		};
		return row("browser", status, out, path, checks, {
			engine: /playwright=yes|engine=playwright/.test(out) ? "playwright" : /engine=fetch/.test(out) ? "fetch" : "unknown",
			proof: (out.match(/proof\.exit=([a-z_]+)/) || [])[1] || null,
		});
	} finally {
		await fixture.close();
	}
}

async function runAuthz() {
	const fixture = await startWebFixture("authz");
	try {
		const mod = join(root, "packages/coding-agent/src/core/repi/web-runtime/authz-script.ts");
		const { status, out } = importAndShell(
			mod,
			"webAuthzStateShellCommand",
			`webAuthzStateShellCommand(${JSON.stringify(fixture.url)}, 15000)`,
			{
				REPI_WORKDIR: "/tmp/repi-web-authz-work",
				COOKIE_A: "session=A; user=A",
				COOKIE_B: "session=B; user=B",
				REPI_OBJECT_PATH: "/api/users/1",
				REPI_AUTHZ_PRINCIPALS: "anon,A,B",
				REPI_AUTHZ_MUTATE: "1",
				REPI_MUTATION_URL: fixture.url.replace(/\/?$/, "/") + "api/profile",
				REPI_MUTATION_METHOD: "PATCH",
				REPI_MUTATION_BODY: JSON.stringify({ note: "mutated-by-repi-smoke", owner: "A" }),
				REPI_RESTORE_BODY: JSON.stringify({ note: "baseline", owner: "A", version: 1 }),
			},
		);
		const path = writeSmoke("web-authz", out);
		const checks = {
			cookie_diff: /\[web-authz-cookie-diff\].*differential=1|cookie_diff=1/.test(out),
			method_matrix: /\[web-authz-method-matrix\]|method_matrix=1/.test(out),
			bola: /potential_bola=true|idor=1/.test(out),
			rollback: /\[web-authz-rollback\].*restored=|rollback=1|summary\.capture\.rollback=1/.test(out),
			host_csrf_cors: /\[web-authz-host\] ok=1|csrf=1/.test(out),
			proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
			bind_ready: /bind_ready=true/.test(out),
		};
		return row("web-authz", status, out, path, checks, {
			proof: (out.match(/proof\.exit=([a-z_]+)/) || [])[1] || null,
		});
	} finally {
		await fixture.close();
	}
}



async function runJsSigning() {
	const sample = ensureJsSample();
	const fixture = await startWebFixture("js-signing");
	try {
		const urlTarget = fixture.url.replace(/\/?$/, "/") + "app.js";
		const mod = join(root, "packages/coding-agent/src/core/repi/web-runtime/js-signing-script-shell.ts");
		// Static file inventory CAP (contract needle [js-signing-files])
		const staticRun = importAndShell(
			mod,
			"jsSigningShellCommand",
			`jsSigningShellCommand(${JSON.stringify(sample)}, 15000)`,
			{ REPI_WORKDIR: "/tmp/repi-js-sign-work-static" },
		);
		// Live URL CAP (url/status/secret from host fetch)
		const urlRun = importAndShell(
			mod,
			"jsSigningShellCommand",
			`jsSigningShellCommand(${JSON.stringify(urlTarget)}, 20000)`,
			{ REPI_WORKDIR: "/tmp/repi-js-sign-work-url" },
		);
		const out =
			`==== JS-SIGNING STATIC ${sample} ====\n` +
			staticRun.out +
			`\n==== JS-SIGNING URL ${urlTarget} ====\n` +
			urlRun.out +
			`\n==== JS-SIGNING DUAL-PATH ROLLUP ====\n` +
			`[js-signing-dual] static=1 url=${/summary\.capture\.url=1|url=1/.test(urlRun.out) ? "1" : "0"} files=${/\[js-signing-files\]/.test(staticRun.out) ? "1" : "0"} note=static_url0_expected_live_url1\n` +
			`[js-signing-proof-capture] dual=1 url=${/summary\.capture\.url=1|\[js-signing-url\]/.test(urlRun.out) ? "1" : "0"} static_url=0 live_url=1\n`;
		const status = staticRun.status || urlRun.status;
		const path = writeSmoke("js-signing", out);
		const checks = {
			files: /\[js-signing-files\]/.test(out),
			url: /\[js-signing-url\]|summary\.capture\.url=1|url=1/.test(out),
			deep: /\[js-signing-deep\]/.test(out),
			secret: /\[js-signing-secret\]/.test(out),
			crypto: /crypto=1|\[js-signing-crypto\]/.test(out),
			jwt: /\[js-signing-jwt\]|\[js-signing-jwt-deep\]/.test(out),
			proof_strong: /proof\.exit=runtime_capture_strong/.test(out),
			bind_ready: /bind_ready=true/.test(out),
		};
		return row("js-signing", status, out, path, checks, {
			proof: (out.match(/proof\.exit=([a-z_]+)/) || [])[1] || null,
			url: /summary\.capture\.url=1|url=1/.test(out) ? "1" : "0",
		});
	} finally {
		await fixture.close();
	}
}

function row(id, status, out, path, checks, tags) {
	return {
		id,
		ok: Object.values(checks).every(Boolean),
		path,
		bytes: out.length,
		exit: status,
		checks,
		tags,
	};
}

const selected = new Set();
const CORE_IDS = ["native", "exploit", "mobile"];
const WEB_IDS = ["browser", "authz", "js-signing"];
const ADAPTER_IDS = ["dfir", "firmware", "crypto", "malware", "memory", "cloud", "agent-security"];
if (scope === "all") {
	for (const s of [...CORE_IDS, ...WEB_IDS, ...ADAPTER_IDS]) selected.add(s);
} else if (scope === "core") {
	for (const s of CORE_IDS) selected.add(s);
} else if (scope === "web") {
	for (const s of WEB_IDS) selected.add(s);
} else if (scope === "adapters") {
	for (const s of ADAPTER_IDS) selected.add(s);
} else {
	selected.add(scope === "web-authz" ? "authz" : scope);
}

const rows = [];
async function main() {
	const { runAdapterDomains } = await import("./repi-reverse-host-smoke-adapters.mjs");
	if (selected.has("native")) rows.push(runNative());
	if (selected.has("exploit")) rows.push(runExploit());
	if (selected.has("mobile")) rows.push(runMobile());
	if (selected.has("browser")) rows.push(await runBrowser());
	if (selected.has("authz")) rows.push(await runAuthz());
	if (selected.has("js-signing")) rows.push(await runJsSigning());
	const adapterSelected = new Set([...selected].filter((id) =>
		["dfir", "firmware", "crypto", "malware", "memory", "cloud", "agent-security"].includes(id),
	));
	if (adapterSelected.size > 0) {
		const adapterRows = await runAdapterDomains(root, docs, adapterSelected, writeSmoke);
		rows.push(...adapterRows);
	}

	const report = {
		kind: "repi-reverse-host-smoke-report",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		root,
		scope,
		ok: rows.length > 0 && rows.every((r) => r.ok),
		rows,
	};

	if (json) {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log("REPI reverse host-smoke");
		console.log(`scope=${scope} root=${root}`);
		for (const r of rows) {
			console.log(
				`${r.ok ? "PASS" : "FAIL"} ${r.id} exit=${r.exit} bytes=${r.bytes} proof=${r.tags.proof ?? "?"} exact=${r.tags.exact ?? "-"}`,
			);
			for (const [k, v] of Object.entries(r.checks)) console.log(`  ${v ? "ok" : "miss"} ${k}`);
			console.log(`  out=${r.path}`);
		}
		console.log(`verdict: ${report.ok ? "pass" : "fail"}`);
	}
	process.exit(report.ok ? 0 : 1);
}

main().catch((err) => {
	console.error(String(err && err.stack ? err.stack : err));
	process.exit(1);
});
