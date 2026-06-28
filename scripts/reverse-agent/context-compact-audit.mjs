#!/usr/bin/env node
// REPI context-compact audit harness.
//
// Verifies that the context-packing, owned-compaction, resume-contract,
// evidence-summarization, budget-continuation, runtime-test, and docs-contract
// markers stay wired across the codebase. Each check targets one file with a
// set of expected marker substrings; a marker is "missing" if it does not
// appear at all. Emits a JSON report on --json (consumed by
// packages/coding-agent/test/recon-context-compact-audit.test.ts) or a
// human-readable PASS/FAIL listing otherwise.
//
// Run: node scripts/reverse-agent/context-compact-audit.mjs <repoRoot> [--json]
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const root = resolve(args.find((a) => !a.startsWith("--")) ?? process.cwd());
const json = args.includes("--json");

function readText(rel) {
	const abs = join(root, rel);
	if (!existsSync(abs)) return null;
	return readFileSync(abs, "utf8");
}

function countOccurrences(text, marker) {
	if (!text) return 0;
	if (marker.length === 0) return 0;
	return text.split(marker).length - 1;
}

// Each category groups one or more file checks. A check passes when its file
// exists and every expected marker appears at least once. Markers are plain
// case-sensitive substrings so the audit mirrors what a reader would grep for.
const CATEGORIES = [
	{
		id: "context_pack",
		checks: [
			{
				file: "packages/coding-agent/src/core/context-manager.ts",
				markers: ["ContextBreakdown", "contextWindow", "context"],
			},
			{
				file: "packages/coding-agent/src/core/compaction/compaction.ts",
				markers: ["prepareCompaction", "CompactionPreparation", "messagesToSummarize", "turnPrefixMessages", "compact"],
			},
		],
	},
	{
		id: "owned_compaction_provider",
		checks: [
			{
				file: "packages/coding-agent/src/core/recon-profile.ts",
				markers: [
					"repi-compaction",
					"repi-compaction-resume-contract",
					"repi-compaction-auto-resume",
					"repi-compaction-resume-telemetry",
					"repi-compaction-checkpoint",
				],
			},
		],
	},
	{
		id: "resume_contract_continuation",
		checks: [
			{
				file: "packages/coding-agent/src/core/recon-profile.ts",
				markers: [
					"repi-compaction-resume-contract",
					"repi-compaction-auto-resume",
					"repi-compaction-resume-telemetry",
					"repi-compaction-checkpoint",
				],
			},
			{
				file: "packages/coding-agent/src/core/repi/memory-compact-resume.ts",
				markers: ["resume", "budget", "compaction"],
			},
		],
	},
	{
		id: "evidence_summarization",
		checks: [
			{
				file: "packages/coding-agent/src/core/repi/evidence.ts",
				markers: ["Evidence", "evidence", "artifact", "hash"],
			},
			{
				file: "packages/coding-agent/src/core/compaction/compaction.ts",
				markers: ["summary", "messagesToSummarize", "compact"],
			},
		],
	},
	{
		id: "budget_continuation",
		checks: [
			{
				file: "packages/coding-agent/src/core/repi/memory-compact-resume.ts",
				markers: ["budget", "resume", "compaction"],
			},
		],
	},
	{
		id: "runtime_tests",
		checks: [
			{
				file: "packages/coding-agent/test/suite/agent-session-compaction.test.ts",
				markers: ["repi-compaction", "compaction"],
			},
			{
				file: "packages/coding-agent/test/agent-session-auto-compaction-queue.test.ts",
				markers: ["compaction", "threshold", "overflow"],
			},
		],
	},
	{
		id: "docs_contract",
		checks: [
			{
				file: "docs/reverse-agent/mainline-overhaul.md",
				markers: ["evidence", "resume", "context", "budget"],
			},
			{
				file: "docs/reverse-agent/repi-runtime-configuration.md",
				markers: ["compaction", "context", "evidence", "resume"],
			},
		],
	},
];

const categories = CATEGORIES.map((category) => {
	const checks = category.checks.map((check) => {
		const text = readText(check.file);
		const exists = text !== null;
		const perMarker = check.markers.map((marker) => ({ marker, count: countOccurrences(text, marker) }));
		const missing = perMarker.filter((entry) => entry.count === 0).map((entry) => entry.marker);
		const markers = perMarker.reduce((sum, entry) => sum + entry.count, 0);
		const status = exists && missing.length === 0 ? "pass" : "fail";
		return { file: check.file, exists, markers, missing, status };
	});
	const status = checks.every((check) => check.status === "pass") ? "pass" : "fail";
	return { id: category.id, status, checks };
});

const passed = categories.filter((category) => category.status === "pass").length;
const failed = categories.length - passed;
const markers = categories.reduce(
	(sum, category) => sum + category.checks.reduce((s, check) => s + check.markers, 0),
	0,
);
const ok = failed === 0;

const report = {
	kind: "repi-context-compact-audit-report",
	schemaVersion: 1,
	root,
	ok,
	summary: { categories: categories.length, passed, failed, markers },
	categories,
};

if (json) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log("REPI Context-Compact Audit");
	console.log(`root: ${root}`);
	for (const category of categories) {
		console.log(`${category.status === "pass" ? "PASS" : "FAIL"} ${category.id}`);
		for (const check of category.checks) {
			console.log(`  ${check.status === "pass" ? "PASS" : "FAIL"} ${check.file} (markers=${check.markers})`);
			if (check.missing.length) console.log(`    missing: ${check.missing.join(", ")}`);
		}
	}
	console.log(`summary: categories=${categories.length} passed=${passed} failed=${failed} markers=${markers}`);
	console.log(`verdict: ${ok ? "pass" : "fail"}`);
}

process.exit(ok ? 0 : 1);
