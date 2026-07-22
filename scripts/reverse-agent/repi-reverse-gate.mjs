#!/usr/bin/env node
/**
 * One-shot reverse product gate:
 *   reverse-proof → reverse-complete → reverse-e2e (scope)
 *
 * Usage:
 *   node scripts/reverse-agent/repi-reverse-gate.mjs [root] [scope] [--json]
 *   repi reverse-gate [core|web|adapters|all|native|...] [--json]
 *
 * Default scope: core (fast, highest-signal). Use all for full 13-domain E2E.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raw = process.argv.slice(2);
const json = raw.includes("--json");
const args = raw.filter((a) => a !== "--json");
const rootArg = args[0] && !args[0].startsWith("-") && existsSync(args[0]) ? args.shift() : undefined;
const scope = (args[0] && !args[0].startsWith("-") ? args.shift() : "core") || "core";
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(rootArg ?? join(here, "../.."));

function runNode(scriptRel, extraArgs = [], timeoutMs = 420000) {
	const script = join(here, scriptRel);
	const r = spawnSync(process.execPath, [script, root, ...extraArgs, ...(json ? ["--json"] : [])], {
		cwd: root,
		encoding: "utf8",
		timeout: timeoutMs,
		maxBuffer: 50 * 1024 * 1024,
		env: process.env,
	});
	const out = `${r.stdout || ""}\n${r.stderr || ""}`;
	let parsed = null;
	if (json) {
		try {
			// last JSON object in stdout
			const text = r.stdout || "";
			const start = text.indexOf("{");
			if (start >= 0) parsed = JSON.parse(text.slice(start));
		} catch {
			parsed = null;
		}
	}
	return {
		status: r.status === null ? 1 : r.status,
		ok: r.status === 0,
		bytes: out.length,
		parsed,
		tail: out.slice(-800),
	};
}

const steps = [];
// 1) offline proof over host-capture smokes
const proof = runNode("repi-reverse-proof-audit.mjs", [], 60000);
steps.push({
	id: "reverse-proof",
	ok: proof.ok,
	exit: proof.status,
	strongCount: proof.parsed?.strongCount ?? null,
	failed: proof.parsed?.failed ?? null,
});
// 2) product completion-audit API
const complete = runNode("repi-reverse-complete-audit.mjs", [], 120000);
steps.push({
	id: "reverse-complete",
	ok: complete.ok,
	exit: complete.status,
	passed: complete.parsed?.passed ?? null,
	failed: complete.parsed?.failed ?? null,
});
// 3) live multi-domain e2e
const e2eTimeout = scope === "all" || scope === "adapters" ? 420000 : 180000;
const e2e = runNode("repi-reverse-runtime-e2e.mjs", [scope], e2eTimeout);
steps.push({
	id: "reverse-e2e",
	ok: e2e.ok,
	exit: e2e.status,
	scope,
	passed: e2e.parsed?.passed ?? null,
	failed: e2e.parsed?.failed ?? null,
	proof_exit: e2e.parsed?.proof_exit ?? null,
	exact_offset: e2e.parsed?.exact_offset ?? null,
});

const report = {
	kind: "repi-reverse-gate-report",
	schemaVersion: 1,
	generatedAt: new Date().toISOString(),
	root,
	scope,
	ok: steps.every((s) => s.ok),
	steps,
	next: steps.every((s) => s.ok)
		? ["repi doctor", "repi smoke --json"]
		: ["repi reverse-smoke all --json", "repi reverse-gate all --json"],
};

if (json) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log("REPI reverse gate");
	console.log(`root=${root} scope=${scope}`);
	for (const s of steps) {
		const mark = s.ok ? "PASS" : "FAIL";
		const extra =
			s.id === "reverse-e2e"
				? ` passed=${s.passed} failed=${JSON.stringify(s.failed || [])} proof=${s.proof_exit}`
				: s.id === "reverse-proof"
					? ` strong=${s.strongCount} failed=${JSON.stringify(s.failed || [])}`
					: ` passed=${s.passed} failed=${JSON.stringify(s.failed || [])}`;
		console.log(`${mark} ${s.id}${extra}`);
	}
	console.log(`verdict: ${report.ok ? "pass" : "fail"}`);
}
process.exit(report.ok ? 0 : 1);
