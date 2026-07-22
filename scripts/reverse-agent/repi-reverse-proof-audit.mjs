#!/usr/bin/env node
/**
 * Offline reverse proof audit across host-capture smokes / evidence blobs.
 *
 * Usage:
 *   node scripts/reverse-agent/repi-reverse-proof-audit.mjs [root] [--json] [--refresh]
 *   repi reverse-proof [--json] [--refresh]
 *
 * --refresh runs `repi reverse-smoke all` first (live CAP regeneration).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const rootArg = args[0] && !args[0].startsWith("--") ? args.shift() : undefined;
const json = args.includes("--json");
const refresh = args.includes("--refresh");
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(rootArg ?? join(here, "../.."));
const docs = join(root, "docs/reverse-agent");
const repiBin = process.env.REPI_BIN_PATH || (existsSync(join(root, "repi")) ? join(root, "repi") : "repi");

const REQUIRED = [
	"native",
	"exploit",
	"mobile",
	"browser",
	"web-authz",
	"js-signing",
	"dfir",
	"firmware",
	"crypto",
	"malware",
	"memory",
	"cloud",
	"agent-security",
];

function readSmoke(name) {
	const path = join(docs, `${name}-host-capture-smoke.out`);
	if (!existsSync(path)) return { path, text: "", missing: true };
	return { path, text: readFileSync(path, "utf8"), missing: false };
}

function auditText(name, text) {
	const proof =
		(text.match(/proof\.exit=([a-z_]+)/i) || [])[1] ||
		(text.match(/summary\.proof_exit=([a-z_]+)/i) || [])[1] ||
		null;
	const bind =
		/bind_ready\s*=\s*true/i.test(text) ||
		/summary\.bind_ready\s*=\s*true/i.test(text) ||
		/bind\.ready\s*=\s*true/i.test(text);
	const strong = proof === "runtime_capture_strong";
	const partial = proof === "partial_runtime_capture";
	const pending = !proof || proof === "pending_runtime_capture";
	const blockers = [];
	const warnings = [];
	if (!text.trim()) blockers.push("missing_smoke_artifact");
	if (pending) blockers.push("pending_or_missing_proof_exit");
	if ((strong || partial) && !bind) blockers.push("runtime_proof_without_bind_ready");
	if (partial) warnings.push("partial_runtime_capture");
	// domain-specific soft warnings (environment, not product failure)
	if (name === "mobile" && /attach_skipped|emulator\] host=0/.test(text)) {
		warnings.push("mobile_usb_or_emulator_absent");
	}
	if (name === "cloud" && /no_local_creds|sts\] ok=0/.test(text)) {
		warnings.push("cloud_creds_absent");
	}
	return {
		domain: name,
		proof_exit: proof,
		bind_ready: bind,
		ok: blockers.length === 0 && (strong || partial) && bind,
		strong,
		blockers,
		warnings,
		bytes: text.length,
	};
}

if (refresh) {
	const refreshArgs = [join(here, "repi-reverse-host-smoke.mjs"), root, "all", ...(json ? [] : [])];
	// Prefer product command when available.
	const r = spawnSync(repiBin, ["reverse-smoke", "all", "--json"], {
		cwd: root,
		encoding: "utf8",
		timeout: 600000,
		maxBuffer: 50 * 1024 * 1024,
		env: { ...process.env, REPI_BIN_PATH: repiBin },
	});
	if (r.status !== 0) {
		// fallback to direct script
		const r2 = spawnSync(process.execPath, refreshArgs, {
			cwd: root,
			encoding: "utf8",
			timeout: 600000,
			maxBuffer: 50 * 1024 * 1024,
		});
		if (r2.status !== 0) {
			const report = {
				kind: "repi-reverse-proof-audit-report",
				schemaVersion: 1,
				ok: false,
				error: "refresh_failed",
				stdoutTail: String(r.stdout || r2.stdout || "").slice(-2000),
				stderrTail: String(r.stderr || r2.stderr || "").slice(-2000),
			};
			if (json) console.log(JSON.stringify(report, null, 2));
			else console.error("refresh failed");
			process.exit(1);
		}
	}
}

const rows = REQUIRED.map((name) => {
	const smoke = readSmoke(name);
	const audited = auditText(name, smoke.text);
	return { ...audited, path: smoke.path, missing: smoke.missing };
});

// Optional: also scan any extra *-host-capture-smoke.out
try {
	for (const file of readdirSync(docs)) {
		const m = /^(.+)-host-capture-smoke\.out$/.exec(file);
		if (!m) continue;
		const name = m[1];
		if (REQUIRED.includes(name)) continue;
		const smoke = readSmoke(name);
		rows.push({ ...auditText(name, smoke.text), path: smoke.path, missing: smoke.missing, extra: true });
	}
} catch {
	// ignore
}

const requiredRows = rows.filter((r) => REQUIRED.includes(r.domain));
const report = {
	kind: "repi-reverse-proof-audit-report",
	schemaVersion: 1,
	generatedAt: new Date().toISOString(),
	root,
	refresh,
	ok: requiredRows.length === REQUIRED.length && requiredRows.every((r) => r.ok),
	required: REQUIRED.length,
	passed: requiredRows.filter((r) => r.ok).length,
	failed: requiredRows.filter((r) => !r.ok).map((r) => r.domain),
	strongCount: requiredRows.filter((r) => r.strong).length,
	rows,
	next:
		requiredRows.every((r) => r.ok)
			? ["repi reverse-smoke all --json", "repi doctor", "repi smoke --json"]
			: ["repi reverse-smoke all --json", "repi reverse-proof --json", "inspect failed domain smoke outs under docs/reverse-agent/"],
};

if (json) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log("REPI reverse proof audit");
	console.log(`root=${root} refresh=${refresh}`);
	for (const r of requiredRows) {
		const mark = r.ok ? "PASS" : "FAIL";
		console.log(
			`${mark} ${r.domain} proof=${r.proof_exit ?? "missing"} bind=${r.bind_ready} bytes=${r.bytes}`,
		);
		if (r.blockers.length) console.log(`  blockers=${r.blockers.join(",")}`);
		if (r.warnings.length) console.log(`  warnings=${r.warnings.join(",")}`);
	}
	console.log(`strong=${report.strongCount}/${REQUIRED.length} passed=${report.passed}/${REQUIRED.length}`);
	console.log(`verdict: ${report.ok ? "pass" : "fail"}`);
}
process.exit(report.ok ? 0 : 1);
