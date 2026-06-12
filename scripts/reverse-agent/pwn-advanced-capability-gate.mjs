#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const rootArg = argv.find((arg) => !arg.startsWith("-"));
const root = resolve(rootArg ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/pwn-advanced-capability.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/pwn-advanced-capability.fixture.json";

const REQUIRED_GATES = [
  "pwn_advanced_capability_gate",
  "pwn_advanced_command_pack_matrix",
  "pwn_advanced_evidence_anchor_matrix",
  "pwn_advanced_followup_self_heal_matrix",
  "pwn_advanced_toolchain_proof_exit_matrix",
  "runtime:pwn-advanced-capability",
];
const REQUIRED_NEGATIVE_CASES = [
  "missing-advanced-command-pack",
  "missing-advanced-analyzer-anchors",
  "missing-advanced-followups",
  "missing-toolchain-proof-exits",
  "missing-route-tooling",
];
const COMMAND_MARKERS = [
  "pwn-advanced-heap-tcache-scaffold",
  "pwn-advanced-format-string-scaffold",
  "pwn-advanced-srop-ret2dlresolve-scaffold",
  "pwn-advanced-one-gadget-constraints",
  "pwn-advanced-seccomp-sandbox-scaffold",
];
const ANALYZER_MARKERS = [
  "pwn heap/tcache anchors",
  "pwn format-string anchors",
  "pwn SROP/ret2dlresolve anchors",
  "pwn one_gadget constraint anchors",
  "pwn seccomp/sandbox anchors",
];
const FOLLOWUP_MARKERS = [
  "pwn-heap-tcache-rerun",
  "pwn-format-string-rerun",
  "pwn-srop-ret2dlresolve-rerun",
  "pwn-one-gadget-constraints-rerun",
  "pwn-seccomp-sandbox-rerun",
];
const SELF_HEAL_MARKERS = [
  "heal-pwn-heap-tcache",
  "heal-pwn-format-string",
  "heal-pwn-srop-ret2dlresolve",
  "heal-pwn-one-gadget-constraints",
  "heal-pwn-seccomp-sandbox",
];
const PROOF_EXIT_MARKERS = [
  "heap/tcache bin state",
  "format-string leak/write",
  "SROP syscall surface",
  "ret2dlresolve payload scaffold",
  "one_gadget constraint review",
  "seccomp/sandbox syscall filter",
];
const ROUTE_TOOLING_MARKERS = [
  "format[-_ ]?string",
  "ret2dlresolve",
  "seccomp-tools",
  "seccomp/sandbox",
  "advanced-exploit/verify",
];

const sha256 = (value) => createHash("sha256").update(String(value ?? "")).digest("hex");
const shortHash = (value) => sha256(value).slice(0, 24);
const check = (id, ok, evidence = {}) => ({ id, status: ok ? "pass" : "fail", evidence });
const readText = (path) => readFileSync(join(root, path), "utf8");
const maybeRead = (path) => (existsSync(join(root, path)) ? readText(path) : "");

function markerRow(id, path, markers) {
  const full = join(root, path);
  if (!existsSync(full)) return check(id, false, { path, exists: false, missing: markers });
  const text = readFileSync(full, "utf8");
  const missing = markers.filter((marker) => !text.includes(marker));
  return check(id, missing.length === 0, { path, missing, markerCount: markers.length, sha256: shortHash(text) });
}

function buildReport() {
  const core = maybeRead("packages/coding-agent/src/core/recon-profile.ts");
  const profile = maybeRead("repi-profile/extensions/reverse-pentest-core.ts");
  const corpus = [core, profile, maybeRead("README.md"), maybeRead("docs/reverse-agent/README.md")].join("\n---REPI_PWN_ADVANCED_CORPUS---\n");
  const rows = [
    markerRow("code:pwn-advanced-command-pack", "packages/coding-agent/src/core/recon-profile.ts", COMMAND_MARKERS),
    markerRow("profile:pwn-advanced-command-pack-mirror", "repi-profile/extensions/reverse-pentest-core.ts", COMMAND_MARKERS),
    markerRow("code:pwn-advanced-analyzer", "packages/coding-agent/src/core/recon-profile.ts", ANALYZER_MARKERS),
    markerRow("profile:pwn-advanced-analyzer-mirror", "repi-profile/extensions/reverse-pentest-core.ts", ANALYZER_MARKERS),
    markerRow("code:pwn-advanced-followups", "packages/coding-agent/src/core/recon-profile.ts", [...FOLLOWUP_MARKERS, ...SELF_HEAL_MARKERS]),
    markerRow("profile:pwn-advanced-followups-mirror", "repi-profile/extensions/reverse-pentest-core.ts", [...FOLLOWUP_MARKERS, ...SELF_HEAL_MARKERS]),
    markerRow("test:pwn-advanced-plan-run", "packages/coding-agent/test/recon-profile.test.ts", [...COMMAND_MARKERS, ...ANALYZER_MARKERS, ...FOLLOWUP_MARKERS]),
    markerRow("toolchain:pwn-advanced-proof-exits", "scripts/reverse-agent/toolchain-domain-capability-gate.mjs", ["seccomp-tools", ...PROOF_EXIT_MARKERS]),
    markerRow("relane:pwn-advanced-command-pack", "scripts/reverse-agent/relane-specialist-command-pack-gate.mjs", [...COMMAND_MARKERS, ...ANALYZER_MARKERS, ...SELF_HEAL_MARKERS, ...PROOF_EXIT_MARKERS]),
    markerRow("domain-proof:pwn-advanced-proof-exits", "scripts/reverse-agent/domain-proof-exit-closure-gate.mjs", PROOF_EXIT_MARKERS),
    markerRow("routing:pwn-advanced-keywords", "packages/coding-agent/src/core/recon-profile.ts", ROUTE_TOOLING_MARKERS),
    markerRow("npm:pwn-advanced-gate", "package.json", ["gate:pwn-advanced-capability", "pwn-advanced-capability-gate.mjs"]),
    markerRow("harness:pwn-advanced-gate", "scripts/reverse-agent/repi-top-harness.mjs", ["gate:pwn-advanced-capability", "PwnAdvancedCapabilityGateV1", "child:gate:pwn-advanced-capability"]),
    markerRow("schema:pwn-advanced-capability", SCHEMA_PATH, ["PwnAdvancedCapabilityGateV1", "pwn_advanced_capability_gate", "pwn_advanced_toolchain_proof_exit_matrix"]),
    markerRow("fixture:pwn-advanced-capability", FIXTURE_PATH, ["PwnAdvancedCapabilityGateV1", "missing-advanced-command-pack", "missing-toolchain-proof-exits"]),
    markerRow("docs:pwn-advanced-capability", "README.md", ["PwnAdvancedCapabilityGateV1", "gate:pwn-advanced-capability", "heap/tcache", "SROP/ret2dlresolve"]),
    markerRow("docs:pwn-advanced-reverse-agent", "docs/reverse-agent/README.md", ["PwnAdvancedCapabilityGateV1", "pwn_advanced_capability_gate", "seccomp/sandbox"]),
  ];
  const markerGroups = {
    commandMarkersFound: COMMAND_MARKERS.filter((marker) => corpus.includes(marker)),
    analyzerMarkersFound: ANALYZER_MARKERS.filter((marker) => corpus.includes(marker)),
    followupMarkersFound: FOLLOWUP_MARKERS.filter((marker) => corpus.includes(marker)),
    selfHealMarkersFound: SELF_HEAL_MARKERS.filter((marker) => corpus.includes(marker)),
    proofExitMarkersFound: PROOF_EXIT_MARKERS.filter((marker) => corpus.includes(marker)),
    routeToolingMarkersFound: ROUTE_TOOLING_MARKERS.filter((marker) => corpus.includes(marker)),
  };
  const closure = {
    allCommandPacksPresent: markerGroups.commandMarkersFound.length === COMMAND_MARKERS.length,
    allAnalyzerAnchorsPresent: markerGroups.analyzerMarkersFound.length === ANALYZER_MARKERS.length,
    allFollowupsPresent: markerGroups.followupMarkersFound.length === FOLLOWUP_MARKERS.length,
    allSelfHealPresent: markerGroups.selfHealMarkersFound.length === SELF_HEAL_MARKERS.length,
    allProofExitsPresent: markerGroups.proofExitMarkersFound.length === PROOF_EXIT_MARKERS.length,
    allRouteToolingPresent: markerGroups.routeToolingMarkersFound.length === ROUTE_TOOLING_MARKERS.length,
  };
  return {
    kind: "PwnAdvancedCapabilityGateV1",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    PwnAdvancedCapabilityGateV1: true,
    runtime: "runtime:pwn-advanced-capability",
    requiredGates: REQUIRED_GATES,
    markerGroups,
    closure,
    rows,
    nextRuntimeCommands: [
      "re_lane plan primitive <target>",
      "re_lane run advanced-exploit <target>",
      "re_exploit_lab run <target> 5",
      "re_proof_loop run <target> 4 2",
      "npm run gate:pwn-advanced-capability",
    ],
    negativeCases: REQUIRED_NEGATIVE_CASES.map((id) => ({ id, rejected: true })),
    invariants: [
      "advanced pwn claims require command-pack, analyzer, follow-up, self-heal, toolchain, proof-exit, test, and harness markers",
      "heap/tcache, format-string, SROP, ret2dlresolve, one_gadget, and seccomp/sandbox cannot be narrative-only capabilities",
    ],
  };
}

function validateReport(report) {
  const errors = [];
  if (report.kind !== "PwnAdvancedCapabilityGateV1") errors.push("kind_invalid");
  if (report.runtime !== "runtime:pwn-advanced-capability") errors.push("runtime_invalid");
  for (const gate of REQUIRED_GATES) if (!report.requiredGates?.includes(gate)) errors.push(`required_gate_missing:${gate}`);
  const negativeIds = new Set((report.negativeCases || []).map((row) => row.id));
  for (const id of REQUIRED_NEGATIVE_CASES) if (!negativeIds.has(id)) errors.push(`negative_case_missing:${id}`);
  for (const [key, value] of Object.entries(report.closure || {})) if (value !== true) errors.push(`closure_false:${key}`);
  for (const row of report.rows || []) if (row.status !== "pass") errors.push(`row_failed:${row.id}`);
  if (!report.nextRuntimeCommands?.some((cmd) => cmd.includes("re_exploit_lab"))) errors.push("next_runtime_missing_exploit_lab");
  return { ok: errors.length === 0, errors };
}

function mutateReport(report, id) {
  const clone = JSON.parse(JSON.stringify(report));
  if (id === "missing-advanced-command-pack") clone.markerGroups.commandMarkersFound.pop();
  if (id === "missing-advanced-analyzer-anchors") clone.markerGroups.analyzerMarkersFound.pop();
  if (id === "missing-advanced-followups") clone.markerGroups.followupMarkersFound.pop();
  if (id === "missing-toolchain-proof-exits") clone.markerGroups.proofExitMarkersFound.pop();
  if (id === "missing-route-tooling") clone.markerGroups.routeToolingMarkersFound.pop();
  clone.closure.allCommandPacksPresent = clone.markerGroups.commandMarkersFound.length === COMMAND_MARKERS.length;
  clone.closure.allAnalyzerAnchorsPresent = clone.markerGroups.analyzerMarkersFound.length === ANALYZER_MARKERS.length;
  clone.closure.allFollowupsPresent = clone.markerGroups.followupMarkersFound.length === FOLLOWUP_MARKERS.length;
  clone.closure.allProofExitsPresent = clone.markerGroups.proofExitMarkersFound.length === PROOF_EXIT_MARKERS.length;
  clone.closure.allRouteToolingPresent = clone.markerGroups.routeToolingMarkersFound.length === ROUTE_TOOLING_MARKERS.length;
  return clone;
}

function main() {
  const report = buildReport();
  const validation = validateReport(report);
  const checks = [...report.rows, check("runtime:pwn-advanced-capability", validation.ok, { validation, closure: report.closure })];
  const negatives = REQUIRED_NEGATIVE_CASES.map((id) => {
    const result = validateReport(mutateReport(report, id));
    return { id, rejected: !result.ok, errors: result.errors };
  });
  checks.push(check("negative:pwn-advanced-capability", negatives.every((row) => row.rejected), { negatives }));
  const failed = checks.filter((row) => row.status !== "pass");
  const result = { ...report, ok: failed.length === 0, root, checks };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "pwn-advanced-capability", result.generatedAt.replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI Pwn Advanced Capability Gate");
    for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
  }
  if (strict && failed.length) process.exitCode = 1;
}

main();
