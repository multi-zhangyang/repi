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
const SCHEMA_PATH = "schemas/reverse-agent/agent-dogfood-failure-signature-binding.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/agent-dogfood-failure-signature-binding.fixture.json";
const REQUIRED_GATES = [
  "AgentDogfoodFailureSignatureBindingGateV1",
  "subagent_runtime_manifest_failure_signature_binding",
  "failure_retry_budget_signature_consistency",
  "repair_queue_item_signature_consistency",
  "claim_ledger_events_carry_failure_signature_binding",
  "dedupe_window_role_scoped_retry_key",
  "runtime_manifest_index_lists_failure_signature_bindings",
  "exhausted_retry_budget_remaining_zero",
];
const REQUIRED_NEGATIVE_CASES = [
  "missing-binding-in-runtime-manifest",
  "retry-budget-retry-key-mismatch",
  "failure-signature-mismatch",
  "missing-runtime-manifest-file",
  "duplicate-role-dedupe-window-mismatch",
];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const check = (id, ok, evidence = {}) => ({ id, status: ok ? "pass" : "fail", evidence });
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));

function markerCheck(id, path, markers) {
  const full = join(root, path);
  if (!existsSync(full)) return check(id, false, { path, exists: false });
  const body = readFileSync(full, "utf8");
  const missing = markers.filter((marker) => !body.includes(marker));
  return check(id, missing.length === 0, { path, missing, sha256: sha256(body).slice(0, 24) });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateBindingPackage(pkg) {
  const binding = pkg.binding;
  const manifest = pkg.runtimeManifest;
  const failure = pkg.failureLedgerEvent;
  const repair = pkg.repairQueueItem;
  const claim = pkg.claimLedgerEvent;
  const index = pkg.manifestIndex;
  const errors = [];
  const signature = binding?.signature;
  if (!binding || binding.kind !== "AgentDogfoodFailureSignatureBindingV1") errors.push("binding.kind");
  if (!binding?.runtimeManifestFile) errors.push("binding.runtimeManifestFile");
  if (!signature) errors.push("binding.signature");
  if (binding?.source !== "agent-dogfood") errors.push("binding.source");
  if (binding?.roleId !== manifest?.roleId) errors.push("binding.roleId_manifest.roleId");
  if (binding?.failureId !== failure?.id) errors.push("binding.failureId_failure.id");
  if (binding?.repairId !== repair?.repairId) errors.push("binding.repairId_repair.repairId");
  if (failure?.signature !== signature) errors.push("failure.signature");
  if (failure?.retryBudget?.retryKey !== signature) errors.push("failure.retryBudget.retryKey");
  if (repair?.signature !== signature) errors.push("repair.signature");
  if (repair?.fromFailureId !== binding?.failureId) errors.push("repair.fromFailureId");
  if (binding?.retryBudget?.retryKey !== signature) errors.push("binding.retryBudget.retryKey");
  if (binding?.status === "exhausted" && binding?.retryBudget?.remainingAttempts !== 0) errors.push("binding.exhausted.remainingAttempts");
  if (failure?.status === "exhausted" && failure?.retryBudget?.remainingAttempts !== 0) errors.push("failure.exhausted.remainingAttempts");
  if (binding?.dedupeWindow?.source !== "agent-dogfood") errors.push("dedupeWindow.source");
  if (binding?.dedupeWindow?.roleId !== binding?.roleId) errors.push("dedupeWindow.roleId");
  if (binding?.dedupeWindow?.retryKey !== signature) errors.push("dedupeWindow.retryKey");
  if (!manifest?.failureSignatureBinding) errors.push("manifest.failureSignatureBinding");
  if (manifest?.failureSignature !== signature) errors.push("manifest.failureSignature");
  if (manifest?.retryBudget?.retryKey !== signature) errors.push("manifest.retryBudget.retryKey");
  if (manifest?.failureLedgerEventId !== binding?.failureId) errors.push("manifest.failureLedgerEventId");
  if (manifest?.repairQueueItemId !== binding?.repairId) errors.push("manifest.repairQueueItemId");
  if (manifest?.failureSignatureBinding?.signature !== signature) errors.push("manifest.failureSignatureBinding.signature");
  if (manifest?.failureSignatureBinding?.dedupeWindow?.retryKey !== signature) errors.push("manifest.failureSignatureBinding.dedupeWindow.retryKey");
  if (claim?.failureSignatureBinding?.signature !== signature) errors.push("claim.failureSignatureBinding.signature");
  if (claim?.failureSignatureBinding?.runtimeManifestFile !== binding?.runtimeManifestFile) errors.push("claim.failureSignatureBinding.runtimeManifestFile");
  if (!Number.isInteger(index?.failureSignatureManifestBindingCount) || index.failureSignatureManifestBindingCount < 1) errors.push("index.failureSignatureManifestBindingCount");
  if (!Array.isArray(index?.failureSignatureManifestBindings) || index.failureSignatureManifestBindings.length < 1) errors.push("index.failureSignatureManifestBindings");
  return { ok: errors.length === 0, errors };
}

function mutatePackage(pkg, id) {
  const row = clone(pkg);
  if (id === "missing-binding-in-runtime-manifest") delete row.runtimeManifest.failureSignatureBinding;
  if (id === "retry-budget-retry-key-mismatch") row.binding.retryBudget.retryKey = "other-signature";
  if (id === "failure-signature-mismatch") row.failureLedgerEvent.signature = "other-signature";
  if (id === "missing-runtime-manifest-file") row.binding.runtimeManifestFile = "";
  if (id === "duplicate-role-dedupe-window-mismatch") row.binding.dedupeWindow.roleId = "mapper";
  return row;
}

function validateFixture(fixture) {
  const gates = new Set(fixture.requiredGates ?? []);
  const negativeIds = new Set((fixture.negativeCases ?? []).map((row) => row.id));
  const pkg = {
    binding: fixture.binding,
    runtimeManifest: fixture.runtimeManifest,
    failureLedgerEvent: fixture.failureLedgerEvent,
    repairQueueItem: fixture.repairQueueItem,
    claimLedgerEvent: fixture.claimLedgerEvent,
    manifestIndex: fixture.manifestIndex,
  };
  const positive = validateBindingPackage(pkg);
  const negativeResults = REQUIRED_NEGATIVE_CASES.map((id) => {
    const result = validateBindingPackage(mutatePackage(pkg, id));
    return { id, rejected: !result.ok, errors: result.errors };
  });
  return {
    missingGates: REQUIRED_GATES.filter((gate) => !gates.has(gate)),
    missingNegativeCases: REQUIRED_NEGATIVE_CASES.filter((id) => !negativeIds.has(id)),
    positive,
    negativeResults,
  };
}

function main() {
  const checks = [];
  try {
    const schema = readJson(SCHEMA_PATH);
    const fixture = readJson(FIXTURE_PATH);
    checks.push(check("schema:parse", Boolean(schema?.$defs?.AgentDogfoodFailureSignatureBindingGateV1 && schema?.$defs?.AgentDogfoodFailureSignatureBindingV1), { path: SCHEMA_PATH }));
    const fixtureEval = validateFixture(fixture);
    checks.push(check("fixture:coverage", fixtureEval.missingGates.length === 0 && fixtureEval.missingNegativeCases.length === 0, fixtureEval));
    checks.push(check("fixture:positive-binding", fixtureEval.positive.ok, fixtureEval.positive));
    checks.push(check("fixture:negative-rejections", fixtureEval.negativeResults.every((row) => row.rejected), { negativeResults: fixtureEval.negativeResults }));
    checks.push(markerCheck("runtime:agent-dogfood-binding-writer", "bench/recon-remote/agent-dogfood/parallel-run.mjs", [
      "AgentDogfoodFailureSignatureBindingV1",
      "failureSignatureManifestBindings",
      "failureSignatureBinding",
      "failureLedgerEventId",
      "repairQueueItemId",
      "retryBudget",
      "dedupeWindow",
      "runtimeManifestFile",
      "failureSignatureManifestBindingsCaptured",
      "failureSignatureManifestBindingCount",
    ]));
    checks.push(markerCheck("harness:agent-dogfood-binding", "scripts/reverse-agent/repi-top-harness.mjs", ["gate:agent-dogfood-failure-signature-binding", "AgentDogfoodFailureSignatureBindingGateV1", "child:gate:agent-dogfood-failure-signature-binding"]));
    checks.push(markerCheck("autonomy:agent-dogfood-binding", "scripts/reverse-agent/autonomy-control-plane.mjs", ["agent_dogfood_failure_signature_binding_gate", "AgentDogfoodFailureSignatureBindingGateV1", "subagent_runtime_manifest_failure_signature_binding"]));
    checks.push(markerCheck("npm:agent-dogfood-binding", "package.json", ["gate:agent-dogfood-failure-signature-binding", "agent-dogfood-failure-signature-binding-gate.mjs"]));
    checks.push(markerCheck("docs:agent-dogfood-binding-readme", "README.md", ["AgentDogfoodFailureSignatureBindingGateV1", "gate:agent-dogfood-failure-signature-binding"]));
    checks.push(markerCheck("docs:agent-dogfood-binding-reverse", "docs/reverse-agent/README.md", ["AgentDogfoodFailureSignatureBindingGateV1", "gate:agent-dogfood-failure-signature-binding"]));
    checks.push(markerCheck("docs:agent-dogfood-binding-control-plane", "docs/reverse-agent/autonomous-control-plane.md", ["AgentDogfoodFailureSignatureBindingGateV1", "gate:agent-dogfood-failure-signature-binding"]));
    checks.push(markerCheck("docs:agent-dogfood-binding-recon", "packages/coding-agent/docs/recon.md", ["AgentDogfoodFailureSignatureBindingGateV1", "gate:agent-dogfood-failure-signature-binding"]));
  } catch (error) {
    checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
  }
  const failed = checks.filter((row) => row.status !== "pass");
  const result = { kind: "repi-agent-dogfood-failure-signature-binding-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), AgentDogfoodFailureSignatureBindingGateV1: true, ok: failed.length === 0, root, checks };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "agent-dogfood-failure-signature-binding", result.generatedAt.replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI AgentDogfoodFailureSignatureBindingGateV1");
    for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
  }
  if (strict && failed.length) process.exit(1);
}
main();
