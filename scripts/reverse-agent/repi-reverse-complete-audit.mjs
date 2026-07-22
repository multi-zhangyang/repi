#!/usr/bin/env node
/**
 * Product reverse completion audit:
 * runs auditReverseProofFromEvidence() (completion-audit reverse API)
 * against each host-capture smoke / optional joined ledger.
 *
 * Usage:
 *   node scripts/reverse-agent/repi-reverse-complete-audit.mjs [root] [--json] [--join]
 *   repi reverse-complete [--json] [--join]
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const rootArg = args[0] && !args[0].startsWith("--") ? args.shift() : undefined;
const json = args.includes("--json");
const joinAll = args.includes("--join");
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(rootArg ?? join(here, "../.."));
const docs = join(root, "docs/reverse-agent");

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

function toLedger(name, text) {
	const proofs = text.match(/proof\.exit=[a-z_]+/gi) || [];
	const binds = /bind_ready\s*=\s*true/i.test(text) ? ["- bind_ready=true"] : [];
	return [
		`# domain=${name}`,
		text,
		...proofs.map((x) => `- ${x}`),
		...binds,
	].join("\n");
}

function auditViaProduct(evidence) {
	const mod = join(root, "packages/coding-agent/src/core/repi/completion-audit/reverse.ts");
	const ledgerPath = `/tmp/repi-complete-audit-ledger-${process.pid}-${Date.now()}.txt`;
	const probePath = `/tmp/repi-complete-audit-probe-${process.pid}-${Date.now()}.mjs`;
	writeFileSync(ledgerPath, evidence);
	writeFileSync(
		probePath,
		`import { readFileSync } from "node:fs";
import { auditReverseProofFromEvidence } from ${JSON.stringify(mod)};
const evidence = readFileSync(${JSON.stringify(ledgerPath)}, "utf8");
const r = auditReverseProofFromEvidence(evidence);
process.stdout.write(JSON.stringify(r));
`,
	);
	const r = spawnSync(process.execPath, ["--import", "tsx", probePath], {
		cwd: root,
		encoding: "utf8",
		timeout: 60000,
		maxBuffer: 20 * 1024 * 1024,
		env: { ...process.env, PATH: process.env.PATH || "/usr/bin:/bin" },
	});
	try {
		unlinkSync(ledgerPath);
	} catch {}
	try {
		unlinkSync(probePath);
	} catch {}
	if (r.status !== 0) {
		return {
			error: String(r.stderr || r.stdout || "audit_failed").slice(0, 2000),
			blockers: ["product_audit_failed"],
			warnings: [],
			reverseSignals: [],
			hasRuntimeProofExit: false,
			hasBindReady: false,
			hasCatalogProofExit: false,
		};
	}
	try {
		return JSON.parse(r.stdout || "{}");
	} catch (e) {
		return {
			error: String(e),
			blockers: ["product_audit_parse_failed"],
			warnings: [],
			reverseSignals: [],
			hasRuntimeProofExit: false,
			hasBindReady: false,
			hasCatalogProofExit: false,
		};
	}
}

const rows = [];
for (const name of REQUIRED) {
	const smoke = readSmoke(name);
	const audited = auditViaProduct(toLedger(name, smoke.text));
	const ok =
		!smoke.missing &&
		Boolean(audited.hasRuntimeProofExit) &&
		Boolean(audited.hasBindReady) &&
		(audited.blockers || []).length === 0;
	rows.push({
		domain: name,
		ok,
		missing: smoke.missing,
		path: smoke.path,
		bytes: smoke.text.length,
		hasRuntimeProofExit: Boolean(audited.hasRuntimeProofExit),
		hasBindReady: Boolean(audited.hasBindReady),
		hasCatalogProofExit: Boolean(audited.hasCatalogProofExit),
		blockers: audited.blockers || [],
		warnings: (audited.warnings || []).slice(0, 8),
		reverseSignals: (audited.reverseSignals || []).slice(0, 8),
		error: audited.error || null,
	});
}

let joinAudit = null;
if (joinAll) {
	const joined = REQUIRED.map((name) => {
		const s = readSmoke(name);
		return toLedger(name, s.text);
	}).join("\n");
	const audited = auditViaProduct(joined);
	joinAudit = {
		ok:
			Boolean(audited.hasRuntimeProofExit) &&
			Boolean(audited.hasBindReady) &&
			(audited.blockers || []).length === 0,
		hasRuntimeProofExit: Boolean(audited.hasRuntimeProofExit),
		hasBindReady: Boolean(audited.hasBindReady),
		blockers: audited.blockers || [],
		warnings: (audited.warnings || []).slice(0, 12),
	};
}

const report = {
	kind: "repi-reverse-complete-audit-report",
	schemaVersion: 1,
	generatedAt: new Date().toISOString(),
	root,
	ok: rows.every((r) => r.ok) && (joinAudit ? joinAudit.ok : true),
	required: REQUIRED.length,
	passed: rows.filter((r) => r.ok).length,
	failed: rows.filter((r) => !r.ok).map((r) => r.domain),
	rows,
	join: joinAudit,
	next: rows.every((r) => r.ok)
		? ["repi reverse-proof --json", "repi reverse-e2e all --json"]
		: ["repi reverse-smoke all --json", "repi reverse-e2e all --json"],
};

if (json) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log("REPI reverse complete audit (product API)");
	console.log(`root=${root}`);
	for (const r of rows) {
		const mark = r.ok ? "PASS" : "FAIL";
		console.log(
			`${mark} ${r.domain} runtime=${r.hasRuntimeProofExit} bind=${r.hasBindReady} bytes=${r.bytes}`,
		);
		if (r.blockers.length) console.log(`  blockers=${r.blockers.join(" | ")}`);
	}
	if (joinAudit) {
		console.log(
			`join ok=${joinAudit.ok} runtime=${joinAudit.hasRuntimeProofExit} bind=${joinAudit.hasBindReady}`,
		);
	}
	console.log(`passed=${report.passed}/${REQUIRED.length}`);
	console.log(`verdict: ${report.ok ? "pass" : "fail"}`);
}
process.exit(report.ok ? 0 : 1);
