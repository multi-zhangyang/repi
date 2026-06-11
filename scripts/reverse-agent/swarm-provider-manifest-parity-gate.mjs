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
const SCHEMA_PATH = "schemas/reverse-agent/swarm-provider-manifest-parity.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/swarm-provider-manifest-parity.fixture.json";
const REQUIRED_GATES = [
  "SwarmProviderManifestParityGateV1",
  "swarm_subagent_manifest_fields_match_provider_worker",
  "child_session_runtime_bridge_matches_provider_worker",
  "claim_refs_preserved_across_manifest_provider_merge",
  "failure_repair_refs_preserved_across_provider_worker",
  "provider_env_refs_only",
  "runtime_artifacts_have_hashes",
  "narrative_only_provider_worker_not_promoted",
];
const REQUIRED_NEGATIVE_CASES = ["worker-id-mismatch", "claim-ref-dropped", "missing-runtime-hash", "literal-provider-secret", "failure-repair-unlinked"];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const check = (id, ok, evidence = {}) => ({ id, status: ok ? "pass" : "fail", evidence });
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));
const clone = (value) => JSON.parse(JSON.stringify(value));

function markerCheck(id, path, markers) {
  const full = join(root, path);
  if (!existsSync(full)) return check(id, false, { path, exists: false });
  const body = readFileSync(full, "utf8");
  const missing = markers.filter((marker) => !body.includes(marker));
  return check(id, missing.length === 0, { path, missing, sha256: sha256(body).slice(0, 24) });
}

function hasHash(value) {
  return /^[a-f0-9]{64}$/.test(String(value || ""));
}

function envRef(value) {
  return typeof value === "string" && value.startsWith("$") && !/^\$?(sk-|ghp_|github_pat_)/i.test(value);
}

function validateParityPackage(pkg) {
  const errors = [];
  const report = pkg.parityReport;
  const manifest = pkg.swarmManifest;
  const childSession = pkg.childSession?.sessions?.[0];
  const provider = pkg.providerWorker;
  if (report?.kind !== "SwarmProviderManifestParityReportV1") errors.push("parityReport.kind");
  if (report?.closureGate !== "gate:swarm-provider-manifest-parity") errors.push("parityReport.closureGate");
  const rows = report?.parityRows || [];
  if (rows.length < 2) errors.push("parityRows.minItems");
  for (const row of rows) {
    if (!row.workerId) errors.push("row.workerId_missing");
    if (!row.runtimeManifestFile) errors.push(`${row.workerId}.runtimeManifestFile_missing`);
    if (!row.sessionDir) errors.push(`${row.workerId}.sessionDir_missing`);
    if (!row.providerName || !row.modelId) errors.push(`${row.workerId}.provider_missing`);
    if (!row.claimRefs?.length) errors.push(`${row.workerId}.claimRefs_missing`);
    if (!hasHash(row.hashes?.stdoutSha256) || !hasHash(row.hashes?.stderrSha256) || !hasHash(row.hashes?.transcriptSha256)) errors.push(`${row.workerId}.hashes_missing`);
    for (const [key, ok] of Object.entries(row.parityChecks || {})) if (ok !== true) errors.push(`${row.workerId}.parityCheck_failed:${key}`);
    if (row.promotionAllowed && !row.parityChecks?.providerEnvRefsOnly) errors.push(`${row.workerId}.promotion_without_env_ref`);
    if (row.promotionAllowed && row.failureRepairRefs?.length) errors.push(`${row.workerId}.failure_worker_promoted`);
  }
  if (manifest && provider) {
    if (manifest.workerId !== provider.workerId) errors.push("manifest_provider.workerId_mismatch");
    if (manifest.stdoutSha256 !== provider.stdoutSha256 || manifest.stderrSha256 !== provider.stderrSha256) errors.push("manifest_provider.hash_mismatch");
    if (!provider.claimRefs?.some((claim) => manifest.mergeKeys?.includes(provider.mergeKey) || childSession?.poolBridge?.claimRefs?.includes(claim))) errors.push("manifest_provider.claimRefs_not_preserved");
  }
  if (childSession && provider) {
    if (childSession.workerId !== provider.workerId) errors.push("child_provider.workerId_mismatch");
    if (childSession.hashes?.stdoutSha256 !== provider.stdoutSha256 || childSession.hashes?.stderrSha256 !== provider.stderrSha256 || childSession.hashes?.transcriptSha256 !== provider.transcriptSha256) errors.push("child_provider.hash_mismatch");
    if (!envRef(childSession.provider?.apiKeyRef) || !envRef(childSession.provider?.baseUrlRef)) errors.push("child_provider.env_ref_invalid");
    if (!childSession.poolBridge?.claimRefs?.some((claim) => provider.claimRefs?.includes(claim))) errors.push("child_provider.claimRefs_dropped");
  }
  if (provider) {
    if (provider.assertions?.apiKeyEnvRefOnly !== true || provider.assertions?.authorizationFromEnv !== true || provider.assertions?.noLiteralSecrets !== true) errors.push("provider.assertions.env_redaction_failed");
    if (provider.status !== "pass" && provider.assertions?.providerWorkerFailureRepairLinked !== true) errors.push("provider.failure_repair_unlinked");
  }
  return { ok: errors.length === 0, errors };
}

function mutatePackage(pkg, id) {
  const row = clone(pkg);
  if (id === "worker-id-mismatch") row.providerWorker.workerId = "other-worker";
  if (id === "claim-ref-dropped") row.providerWorker.claimRefs = [];
  if (id === "missing-runtime-hash") row.providerWorker.stdoutSha256 = "";
  if (id === "literal-provider-secret") row.childSession.sessions[0].provider.apiKeyRef = "sk-live-secret";
  if (id === "failure-repair-unlinked") row.parityReport.parityRows[1].parityChecks.failureRepairLinked = false;
  return row;
}

function validateFixture(fixture) {
  const gates = new Set(fixture.requiredGates || []);
  const negativeIds = new Set((fixture.negativeCases || []).map((row) => row.id));
  const positive = validateParityPackage(fixture);
  const negativeResults = REQUIRED_NEGATIVE_CASES.map((id) => {
    const result = validateParityPackage(mutatePackage(fixture, id));
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
    checks.push(check("schema:parse", Boolean(schema?.$defs?.SwarmProviderManifestParityGateV1 && schema?.$defs?.SwarmProviderManifestParityReportV1), { path: SCHEMA_PATH }));
    const fixtureEval = validateFixture(fixture);
    checks.push(check("fixture:coverage", fixtureEval.missingGates.length === 0 && fixtureEval.missingNegativeCases.length === 0, fixtureEval));
    checks.push(check("fixture:positive-parity", fixtureEval.positive.ok, fixtureEval.positive));
    checks.push(check("fixture:negative-parity", fixtureEval.negativeResults.every((row) => row.rejected), { negativeResults: fixtureEval.negativeResults }));
    checks.push(markerCheck("runtime:swarm-provider-manifest-parity-core", "packages/coding-agent/src/core/recon-profile.ts", [
      "SubagentRuntimeManifestV1",
      "WorkerChildSessionRuntimeBatchV1",
      "workerChildSessionRuntimePath",
      "workerChildSessionToWorkerRuntimePoolBridge",
      "ParallelProviderWorkerMatrixV1",
      "claimAwareProviderWorkerMerge",
    ]));
    checks.push(markerCheck("runtime:swarm-provider-manifest-parity-worker-child", "scripts/reverse-agent/worker-child-session-gate.mjs", ["runtime:worker-child-session-batch", "runtime:worker-provider-child-process-smoke", "WorkerProviderChildProcessProbeV1", "provider runtime"]));
    checks.push(markerCheck("runtime:swarm-provider-manifest-parity-provider-worker", "scripts/reverse-agent/parallel-provider-worker-matrix-gate.mjs", ["ParallelProviderWorkerMatrixV1", "runtime:parallel-provider-worker-claim-merge", "runtime:parallel-provider-worker-failure-repair", "claimAwareProviderWorkerMerge"]));
    checks.push(markerCheck("harness:swarm-provider-manifest-parity", "scripts/reverse-agent/repi-top-harness.mjs", ["gate:swarm-provider-manifest-parity", "SwarmProviderManifestParityGateV1", "child:gate:swarm-provider-manifest-parity"]));
    checks.push(markerCheck("autonomy:swarm-provider-manifest-parity", "scripts/reverse-agent/autonomy-control-plane.mjs", ["swarm_provider_manifest_parity_gate", "SwarmProviderManifestParityGateV1", "gate:swarm-provider-manifest-parity"]));
    checks.push(markerCheck("npm:swarm-provider-manifest-parity", "package.json", ["gate:swarm-provider-manifest-parity", "swarm-provider-manifest-parity-gate.mjs"]));
    checks.push(markerCheck("docs:swarm-provider-manifest-parity-readme", "README.md", ["SwarmProviderManifestParityGateV1", "gate:swarm-provider-manifest-parity"]));
    checks.push(markerCheck("docs:swarm-provider-manifest-parity-control-plane", "docs/reverse-agent/autonomous-control-plane.md", ["SwarmProviderManifestParityGateV1", "gate:swarm-provider-manifest-parity"]));
  } catch (error) {
    checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
  }
  const failed = checks.filter((row) => row.status !== "pass");
  const result = { kind: "repi-swarm-provider-manifest-parity-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), SwarmProviderManifestParityGateV1: true, ok: failed.length === 0, root, checks };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "swarm-provider-manifest-parity", result.generatedAt.replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI SwarmProviderManifestParityGateV1");
    for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
  }
  if (strict && failed.length) process.exit(1);
}
main();
