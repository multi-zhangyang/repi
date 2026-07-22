#!/usr/bin/env node
/**
 * Offline multi-domain reverse runtime E2E:
 *  - native: /tmp/repi-vuln → strong/bind + exact offset + gdb dyn
 *  - exploit: same target → strong/bind + crash/exact
 *  - mobile: APK + host-local frida attach/hook → strong/bind + local_attach
 *  - js-signing: sample JS → strong/bind + secret/jwt
 *  - browser: child fixture + playwright capture → strong/bind
 *  - authz/web-authz: child fixture + cookie/method matrix → strong/bind
 *  - adapters (dfir/firmware/crypto/malware/memory/cloud/agent-security): host CAP templates → strong/bind
 *
 * Usage:
 *   node scripts/reverse-agent/repi-reverse-runtime-e2e.mjs [root] [scope] [--json]
 *   repi reverse-e2e [native|exploit|mobile|js-signing|browser|authz|web|adapters|dfir|firmware|crypto|malware|memory|cloud|agent-security|core|all] [--json]
 *
 * Default scope: all
 */
import { spawn, spawnSync } from "node:child_process";
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rawArgs = process.argv.slice(2);
const json = rawArgs.includes("--json");
const args = rawArgs.filter((a) => a !== "--json");
const rootArg = args[0] && !args[0].startsWith("-") && existsSync(args[0]) ? args.shift() : undefined;
const scope = (args[0] && !args[0].startsWith("-") ? args.shift() : "all") || "all";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(rootArg ?? join(here, "../.."));
const outDir = join(root, "docs/reverse-agent");
mkdirSync(outDir, { recursive: true });

const PATH_PREFIX =
	"/usr/local/bin:/usr/bin:/bin:/opt/repi-tools/rizin:/opt/jadx/bin:/root/.local/bin";

const SCOPES = new Set([
	"native",
	"exploit",
	"mobile",
	"js-signing",
	"browser",
	"authz",
	"web-authz",
	"web",
	"dfir",
	"firmware",
	"crypto",
	"malware",
	"memory",
	"cloud",
	"agent-security",
	"adapters",
	"core",
	"all",
]);

function ensureVuln() {
	const bin = "/tmp/repi-vuln";
	if (existsSync(bin)) return bin;
	const src = "/tmp/repi-vuln.c";
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
	const path = "/tmp/repi-js-signing-sample.js";
	writeFileSync(
		path,
		`
// repi js-signing e2e sample
const crypto = require("crypto");
const secret = "super-secret-signing-key-repi";
const jwtHeader = Buffer.from(JSON.stringify({alg:"HS256",typ:"JWT"})).toString("base64url");
const jwtPayload = Buffer.from(JSON.stringify({sub:"repi",role:"admin"})).toString("base64url");
const sig = crypto.createHmac("sha256", secret).update(jwtHeader+"."+jwtPayload).digest("base64url");
const token = jwtHeader+"."+jwtPayload+"."+sig;
function signRequest(body){
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}
module.exports = { secret, token, signRequest, APP_KEY: "AIzaSyDemoKeyForSigning" };
`,
	);
	return path;
}

function importAndShell(modulePath, exportName, callExpr, extraEnv = {}, timeoutMs = 150000) {
	const runner = `
import { spawn, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { ${exportName} } from ${JSON.stringify(modulePath)};
const cmd = ${callExpr};
const env = {
  ...process.env,
  REPI_NATIVE_DYN: process.env.REPI_NATIVE_DYN || "1",
  REPI_FRIDA_LOCAL_ATTACH: process.env.REPI_FRIDA_LOCAL_ATTACH || "1",
  PATH: ${JSON.stringify(PATH_PREFIX)},
  NODE_PATH: "/usr/lib/node_modules:/usr/local/lib/node_modules",
  ...${JSON.stringify(extraEnv)},
};
const scriptPath = "/tmp/repi-reverse-e2e-" + process.pid + "-" + Date.now() + ".sh";
writeFileSync(scriptPath, "#!/usr/bin/env bash\\nset +e\\n" + cmd + "\\n");
const r = spawnSync("bash", ["--noprofile", "--norc", scriptPath], {
  encoding: "utf8",
  env,
  timeout: ${timeoutMs},
  maxBuffer: 40 * 1024 * 1024,
});
const out = \`\${r.stdout || ""}\\n\${r.stderr || ""}\`;
process.stdout.write(out);
process.exit(r.status === null ? 1 : r.status);
`;
	const r = spawnSync(process.execPath, ["--import", "tsx", "-e", runner], {
		cwd: root,
		encoding: "utf8",
		timeout: timeoutMs + 30000,
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

function writeE2e(name, text) {
	const path = join(outDir, `${name}-runtime-e2e.out`);
	writeFileSync(path, text);
	return path;
}

function baseAudit(text) {
	const proof =
		(text.match(/proof\.exit=([a-z_]+)/i) || [])[1] ||
		(text.match(/summary\.proof_exit=([a-z_]+)/i) || [])[1] ||
		null;
	const bind =
		/bind_ready\s*=\s*true/i.test(text) || /summary\.bind_ready\s*=\s*true/i.test(text);
	return {
		proof_exit: proof,
		bind_ready: bind,
		strong: proof === "runtime_capture_strong",
	};
}

function runNative() {
	const bin = ensureVuln();
	const mod = join(root, "packages/coding-agent/src/core/repi/reverse-runtime/native-shell.ts");
	const { status, out } = importAndShell(
		mod,
		"nativeRuntimeShellCommand",
		`nativeRuntimeShellCommand(${JSON.stringify(bin)}, 20000)`,
	);
	const path = writeE2e("native", out);
	// keep legacy alias
	writeFileSync(join(outDir, "native-runtime-e2e.out"), out);
	const base = baseAudit(out);
	const exact = (out.match(/\[native-dyn-offset\] exact=(\d+)/) || [])[1] || null;
	const checks = {
		...base,
		exact_offset: Boolean(exact),
		gdb_dyn: /gdb=1/.test(out) && /dyn=1/.test(out),
		checksec: /\[native-checksec\]/.test(out),
		rop: /\[native-ropgadget\]|\[native-rop-pure\] ok=1/.test(out),
	};
	const blockers = Object.entries(checks)
		.filter(([, v]) => !v)
		.map(([k]) => k);
	return {
		id: "native",
		ok: blockers.length === 0,
		exit: status,
		path,
		bytes: out.length,
		tags: { exact, proof: base.proof_exit },
		checks,
		blockers,
	};
}

function runExploit() {
	const bin = ensureVuln();
	const mod = join(root, "packages/coding-agent/src/core/repi/reverse-runtime/exploit-shell.ts");
	const { status, out } = importAndShell(
		mod,
		"exploitLabShellCommand",
		`exploitLabShellCommand(${JSON.stringify(bin)}, 3, 8000)`,
	);
	const path = writeE2e("exploit", out);
	const base = baseAudit(out);
	const exact = (out.match(/exact=(\d+)/) || [])[1] || null;
	const checks = {
		...base,
		crash_or_exact: /crash=1|SIGSEGV|exact=\d+|\[exploit-lab-crash\]/.test(out),
		mitigation: /\[exploit-lab-checksec\]|\[exploit-lab-mitigation\]/.test(out),
		runs: /\[exploit-lab-replay\] run=|runs=\d+/.test(out),
		rop_or_one: /\[exploit-lab-ropgadget\] ok=1|\[exploit-lab-one-gadget\] ok=1|rop=1|one_gadget=1/.test(out),
	};
	const blockers = Object.entries(checks)
		.filter(([, v]) => !v)
		.map(([k]) => k);
	return {
		id: "exploit",
		ok: blockers.length === 0,
		exit: status,
		path,
		bytes: out.length,
		tags: { exact, proof: base.proof_exit },
		checks,
		blockers,
	};
}

function runMobile() {
	const apk = ensureMobileApk();
	const mod = join(root, "packages/coding-agent/src/core/repi/reverse-runtime/mobile-shell.ts");
	const { status, out } = importAndShell(
		mod,
		"mobileRuntimeShellCommand",
		`mobileRuntimeShellCommand(${JSON.stringify(apk)}, undefined, 15000)`,
		{ REPI_FRIDA_LOCAL_ATTACH: "1" },
	);
	const path = writeE2e("mobile", out);
	const base = baseAudit(out);
	const checks = {
		...base,
		apk: /\[mobile-apk\]|\[mobile-apk-deep\]/.test(out),
		package_hits: /package_hits=[1-9]|summary\.mobile_package=1|\[mobile-package-candidate\]/.test(out),
		dex_methods: /methods=[1-9]|summary\.mobile_dex_methods=1|\[mobile-dex-method\]/.test(out),
		frida: /frida=1|\[mobile-frida/.test(out),
		local_attach: /local_attach=1|summary\.local_attach=1|\[mobile-frida-local\] ok=1/.test(out),
		interceptor: /interceptor=|hooked=1|mobile-frida-local-hook/.test(out),
	};
	const blockers = Object.entries(checks)
		.filter(([, v]) => !v)
		.map(([k]) => k);
	return {
		id: "mobile",
		ok: blockers.length === 0,
		exit: status,
		path,
		bytes: out.length,
		tags: {
			local_attach: checks.local_attach ? "1" : "0",
			proof: base.proof_exit,
		},
		checks,
		blockers,
	};
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

async function runBrowser() {
	const fixture = await startWebFixture("browser");
	try {
		const mod = join(root, "packages/coding-agent/src/core/repi/web-runtime/browser-capture-script.ts");
		const { status, out } = importAndShell(
			mod,
			"liveBrowserShellCommand",
			`liveBrowserShellCommand(${JSON.stringify(fixture.url)}, 20000)`,
			{ REPI_WORKDIR: "/tmp/repi-browser-e2e" },
		);
		const path = writeE2e("browser", out);
		const base = baseAudit(out);
		const checks = {
			...base,
			engine_playwright: /\[browser-engine\] playwright=yes|engine=playwright/.test(out),
			storage: /storage=1|\[browser-storage\]|cookies=1/.test(out),
			api_or_scripts: /api=1|scripts=1|\[browser-script\]|\[browser-xhr\]/.test(out),
		};
		const blockers = Object.entries(checks)
			.filter(([, v]) => !v)
			.map(([k]) => k);
		return {
			id: "browser",
			ok: blockers.length === 0,
			exit: status,
			path,
			bytes: out.length,
			tags: {
				engine: /playwright=yes|engine=playwright/.test(out)
					? "playwright"
					: /engine=fetch/.test(out)
						? "fetch"
						: "unknown",
				proof: base.proof_exit,
			},
			checks,
			blockers,
		};
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
				REPI_WORKDIR: "/tmp/repi-web-authz-e2e",
				COOKIE_A: "session=A; user=A",
				COOKIE_B: "session=B; user=B",
				REPI_OBJECT_PATH: "/api/users/1",
				REPI_AUTHZ_PRINCIPALS: "anon,A,B",
				REPI_AUTHZ_MUTATE: "1",
				REPI_MUTATION_URL: fixture.url.replace(/\/?$/, "/") + "api/profile",
				REPI_MUTATION_METHOD: "PATCH",
				REPI_MUTATION_BODY: JSON.stringify({ note: "mutated-by-repi-e2e", owner: "A" }),
				REPI_RESTORE_BODY: JSON.stringify({ note: "baseline", owner: "A" }),
			},
		);
		const path = writeE2e("web-authz", out);
		const base = baseAudit(out);
		const checks = {
			...base,
			cookie_diff: /\[web-authz-cookie-diff\].*differential=1|cookie_diff=1/.test(out),
			method_matrix: /\[web-authz-method-matrix\]|method_matrix=1/.test(out),
			bola: /potential_bola=true|idor=1/.test(out),
			host_csrf_cors: /\[web-authz-host\] ok=1|csrf=1/.test(out),
		};
		const blockers = Object.entries(checks)
			.filter(([, v]) => !v)
			.map(([k]) => k);
		return {
			id: "web-authz",
			ok: blockers.length === 0,
			exit: status,
			path,
			bytes: out.length,
			tags: { proof: base.proof_exit },
			checks,
			blockers,
		};
	} finally {
		await fixture.close();
	}
}


const ADAPTER_IDS = [
	"dfir",
	"firmware",
	"crypto",
	"malware",
	"memory",
	"cloud",
	"agent-security",
];

function selectedDomains() {
	if (!SCOPES.has(scope)) {
		throw new Error(`unknown scope=${scope}; expected one of ${[...SCOPES].join("|")}`);
	}
	const core = ["native", "exploit", "mobile"];
	const web = ["browser", "authz", "js-signing"];
	if (scope === "all") return [...core, ...web, ...ADAPTER_IDS];
	if (scope === "core") return core;
	if (scope === "web") return web;
	if (scope === "adapters") return [...ADAPTER_IDS];
	if (scope === "web-authz") return ["authz"];
	return [scope];
}

async function runJsSigning() {
	const sample = ensureJsSample();
	const fixture = await startWebFixture("js-signing");
	try {
		const urlTarget = fixture.url.replace(/\/?$/, "/") + "app.js";
		const mod = join(root, "packages/coding-agent/src/core/repi/web-runtime/js-signing-script-shell.ts");
		const staticRun = importAndShell(
			mod,
			"jsSigningShellCommand",
			`jsSigningShellCommand(${JSON.stringify(sample)}, 15000)`,
			{ REPI_WORKDIR: "/tmp/repi-js-sign-e2e-static" },
		);
		const urlRun = importAndShell(
			mod,
			"jsSigningShellCommand",
			`jsSigningShellCommand(${JSON.stringify(urlTarget)}, 20000)`,
			{ REPI_WORKDIR: "/tmp/repi-js-sign-e2e-url" },
		);
		const out =
			`==== JS-SIGNING STATIC ${sample} ====\n` +
			staticRun.out +
			`\n==== JS-SIGNING URL ${urlTarget} ====\n` +
			urlRun.out;
		const status = staticRun.status || urlRun.status;
		const path = writeE2e("js-signing", out);
		const base = baseAudit(out);
		const checks = {
			...base,
			files: /\[js-signing-files\]/.test(out),
			url: /\[js-signing-url\]|summary\.capture\.url=1|url=1/.test(out),
			deep: /\[js-signing-deep\]/.test(out),
			secret: /\[js-signing-secret\]/.test(out),
			jwt_or_crypto: /\[js-signing-jwt\]|\[js-signing-crypto\]|crypto=1/.test(out),
		};
		const blockers = Object.entries(checks)
			.filter(([, v]) => !v)
			.map(([k]) => k);
		return {
			id: "js-signing",
			ok: blockers.length === 0,
			exit: status,
			path,
			bytes: out.length,
			tags: { proof: base.proof_exit, url: checks.url ? "1" : "0" },
			checks,
			blockers,
		};
	} finally {
		await fixture.close();
	}
}

const runners = {
	native: runNative,
	exploit: runExploit,
	mobile: runMobile,
	"js-signing": runJsSigning,
	browser: runBrowser,
	authz: runAuthz,
};

function mapAdapterRow(adapterRow) {
	const checks = adapterRow.checks || {};
	const blockers = Object.entries(checks)
		.filter(([, v]) => !v)
		.map(([k]) => k);
	return {
		id: adapterRow.id,
		ok: Boolean(adapterRow.ok) && blockers.length === 0,
		exit: adapterRow.exit,
		path: adapterRow.path,
		bytes: adapterRow.bytes,
		tags: adapterRow.tags || {},
		checks: {
			...checks,
			proof_exit: checks.proof_strong,
			bind_ready: checks.bind_ready,
			strong: checks.proof_strong,
		},
		blockers,
	};
}

async function runAdapterE2e(selectedIds) {
	const { runAdapterDomains } = await import("./repi-reverse-host-smoke-adapters.mjs");
	const selected = new Set(selectedIds);
	const writeSmoke = (name, text) => {
		// dual-write: host-capture smoke (contract) + runtime-e2e artifact
		const smokePath = join(outDir, `${name}-host-capture-smoke.out`);
		writeFileSync(smokePath, text);
		writeFileSync(join(outDir, `${name}-runtime-e2e.out`), text);
		return smokePath;
	};
	const adapterRows = await runAdapterDomains(root, outDir, selected, writeSmoke);
	return adapterRows.map(mapAdapterRow);
}

async function main() {
	let report;
	try {
		const domains = selectedDomains();
		const rows = [];
		const adapterSelected = domains.filter((id) => ADAPTER_IDS.includes(id));
		const direct = domains.filter((id) => !ADAPTER_IDS.includes(id));
		for (const id of direct) {
			const fn = runners[id];
			if (!fn) throw new Error(`no runner for ${id}`);
			rows.push(await fn());
		}
		if (adapterSelected.length > 0) {
			rows.push(...(await runAdapterE2e(adapterSelected)));
		}
		const primary = rows.find((r) => r.id === "native") || rows[0];
		report = {
			kind: "repi-reverse-runtime-e2e-report",
			schemaVersion: 4,
			generatedAt: new Date().toISOString(),
			root,
			scope,
			ok: rows.every((r) => r.ok),
			// backward-compatible top-level fields (native preferred)
			proof_exit: primary?.tags?.proof || primary?.checks?.proof_exit || null,
			bind_ready: Boolean(primary?.checks?.bind_ready),
			exact_offset: primary?.tags?.exact || null,
			gdb_dyn: Boolean(primary?.checks?.gdb_dyn),
			checksec: Boolean(primary?.checks?.checksec),
			rop: Boolean(primary?.checks?.rop),
			passed: rows.filter((r) => r.ok).length,
			failed: rows.filter((r) => !r.ok).map((r) => r.id),
			rows,
			next: rows.every((r) => r.ok)
				? ["repi reverse-proof --json", "repi reverse-smoke all --json"]
				: ["repi reverse-e2e all --json", "inspect docs/reverse-agent/*-runtime-e2e.out"],
		};
	} catch (error) {
		report = {
			kind: "repi-reverse-runtime-e2e-report",
			schemaVersion: 4,
			ok: false,
			error: String(error && error.stack ? error.stack : error),
		};
	}

	if (json) {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log("REPI reverse runtime E2E");
		console.log(`scope=${report.scope || scope} root=${root}`);
		for (const r of report.rows || []) {
			const mark = r.ok ? "PASS" : "FAIL";
			console.log(
				`${mark} ${r.id} proof=${r.tags?.proof || r.checks?.proof_exit || "missing"} bytes=${r.bytes}`,
			);
			if (r.blockers?.length) console.log(`  blockers=${r.blockers.join(",")}`);
		}
		console.log(`passed=${report.passed}/${(report.rows || []).length}`);
		console.log(`verdict: ${report.ok ? "pass" : "fail"}`);
	}
	process.exit(report.ok ? 0 : 1);
}

await main();
