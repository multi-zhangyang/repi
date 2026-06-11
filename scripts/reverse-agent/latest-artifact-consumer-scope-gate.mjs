#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const argv = process.argv.slice(2);
const rootArg = argv.find((arg) => !arg.startsWith("-"));
const root = resolve(rootArg ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const keepTmp = argv.includes("--keep-tmp") || process.env.KEEP_REPI_LATEST_ARTIFACT_CONSUMER_SCOPE_TMP === "1";
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/latest-artifact-consumer-scope.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/latest-artifact-consumer-scope.fixture.json";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));
const REQUIRED_GATES = [
  "LatestArtifactConsumerScopeGateV1",
  "operator_feedback_latest_artifact_consumer",
  "proof_loop_gap_latest_artifact_consumer",
  "proof_loop_evidence_latest_artifact_consumer",
  "proof_loop_source_latest_artifact_consumer",
  "compiler_claim_gate_latest_artifact_consumer",
  "cross_target_latest_artifact_blocked",
  "same_target_older_artifact_selected",
];

function check(id, status, evidence = {}) { return { id, status: status ? "pass" : "fail", evidence }; }
function validateFixture(fixture) {
  const gates = new Set(fixture.requiredGates ?? []);
  const scenarios = new Set((fixture.scenarios ?? []).map((row) => row.id));
  return {
    missingGates: REQUIRED_GATES.filter((gate) => !gates.has(gate)),
    missingScenarios: ["operator-feedback-cross-target-block", "proof-loop-gap-cross-target-block", "proof-loop-evidence-cross-target-block", "proof-loop-source-cross-target-block", "compiler-claim-gate-cross-target-block"].filter((id) => !scenarios.has(id)),
  };
}

function writeProbe(probePath, outPath, tempRoot) {
  const importUrl = pathToFileURL(join(root, "packages/coding-agent/src/core/recon-profile.ts")).href;
  writeFileSync(probePath, `
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createReconExtensionFactory } from ${JSON.stringify(importUrl)};

const outPath = ${JSON.stringify(outPath)};
const tempRoot = ${JSON.stringify(tempRoot)};
const agentDir = join(tempRoot, "agent");
const workspace = join(tempRoot, "workspace");
const recon = join(agentDir, "recon");
const dirs = {
  verifiers: join(recon, "evidence", "verifiers"),
  compilers: join(recon, "evidence", "compilers"),
  replayers: join(recon, "evidence", "replayers"),
  autofix: join(recon, "evidence", "autofix"),
  supervisor: join(recon, "evidence", "supervisor"),
  swarms: join(recon, "evidence", "swarms"),
};
mkdirSync(agentDir, { recursive: true });
mkdirSync(workspace, { recursive: true });
for (const dir of Object.values(dirs)) mkdirSync(dir, { recursive: true });
process.chdir(workspace);
process.env.REPI_CODING_AGENT_DIR = agentDir;
process.env.REPI_SESSION_ID = "latest-artifact-consumer-scope-session";
process.env.REPI_BRANCH_ID = "latest-artifact-consumer-scope-branch";
process.env.REPI_PRODUCT = "1";
process.env.PI_RECON_PRODUCT = "1";
const tools = new Map();
const fakePi = { registerCommand() {}, registerTool(tool) { tools.set(tool.name, tool); }, on() {}, appendEntry() {}, getSessionName: () => undefined, setSessionName() {}, sendMessage() {}, exec: async () => ({ code: 0, stdout: "latest-artifact-consumer-scope", stderr: "", killed: false }) };
createReconExtensionFactory()(fakePi);
const memory = tools.get("re_memory");
const operator = tools.get("re_operator");
const proofLoop = tools.get("re_proof_loop");
const compiler = tools.get("re_compiler");
if (!memory || !operator || !proofLoop || !compiler) throw new Error("missing REPI tools");
function text(result) { return result?.content?.[0]?.text ?? ""; }
function markdownArtifact(path, title, data, marker) {
  const fence = String.fromCharCode(96).repeat(3);
  writeFileSync(path, ["# " + title, "", marker, "", "## JSON", "", fence + "json", JSON.stringify(data, null, 2), fence, ""].join("\\n"), "utf8");
  return path;
}
function feedback(marker, target) {
  return "category=runtime_failure status=blocked command='curl " + target + "/" + marker + "' next=re_autofix plan " + target + " evidence=" + marker;
}
function artifactData(kind, target, marker) {
  const common = { timestamp: new Date().toISOString(), missionId: "scope-consumer", route: "Security general", target, operatorFeedback: [feedback(marker, target)], sourceArtifacts: [] };
  if (kind === "verifier") return { ...common, assertions: [], gaps: [marker + " verifier gap"], contradictions: [], nextActions: [] };
  if (kind === "compiler") return { ...common, gaps: [marker + " compiler gap"], contradictions: [], statusSummary: { proved: 0, weak: 0, contradicted: 0, missing: 1 }, nextOperatorQueue: ["re_operator dispatch " + target + " 1"] };
  if (kind === "replayer") return { ...common, blocked: [marker + " replay blocked"], executions: [], steps: [] };
  if (kind === "autofix") return { ...common, failures: [marker + " autofix failure"], patchQueue: [], commandSubstitutions: [], bootstrapQueue: [], evidenceRecaptureQueue: [], applied: [] };
  if (kind === "supervisor") return { ...common, releaseGateMetadata: [marker + " release metadata"], claimGatePolicy: [marker + " claim policy"], claimGateResult: [marker + " claim result"], strictClaimGate: { status: "missing", requiredGaps: [marker + " strict gap"] }, repairQueue: [], nextActions: [], commanderMergeQueue: [], commanderMergeBudget: [], workerScoreboard: [] };
  if (kind === "swarm") return { ...common, releaseGateMetadata: [marker + " swarm release metadata"], parallelPlan: { planId: marker, workers: [] } };
  return common;
}
async function bindArtifact(path, target, marker) {
  const payload = [
    "target=" + target,
    "route=Security general",
    "outcome=success",
    "confidence=0.97",
    "replayVerified=true",
    "playbookCandidate=true",
    "verifierRuleCandidate=true",
    "artifactPath=" + path,
    "command=re_operator dispatch " + target + " 1",
    marker + " scope binding for latest artifact consumer",
  ].join(" ");
  await memory.execute("latest-artifact-consumer-scope", { action: "append", scene: "web", title: marker, text: payload });
}
async function createPair(kind, dir, targetB, targetA) {
  const allowed = markdownArtifact(join(dir, "2026-06-11-000-allowed-target-b-" + kind + ".md"), "allowed target b " + kind, artifactData(kind, targetB, "TARGET_B_ALLOWED_" + kind), "TARGET_B_ALLOWED_" + kind);
  await bindArtifact(allowed, targetB, "TARGET_B_ALLOWED_" + kind);
  const blocked = markdownArtifact(join(dir, "2026-06-11-999-blocked-target-a-" + kind + ".md"), "blocked target a " + kind, artifactData(kind, targetA, "TARGET_A_BLOCKED_" + kind), "TARGET_A_BLOCKED_" + kind);
  await bindArtifact(blocked, targetA, "TARGET_A_BLOCKED_" + kind);
  return { allowed, blocked };
}
async function main() {
  const targetA = "https://consumer-a.local";
  const targetB = "https://consumer-b.local";
  const artifacts = {
    verifier: await createPair("verifier", dirs.verifiers, targetB, targetA),
    compiler: await createPair("compiler", dirs.compilers, targetB, targetA),
    replayer: await createPair("replayer", dirs.replayers, targetB, targetA),
    autofix: await createPair("autofix", dirs.autofix, targetB, targetA),
    supervisor: await createPair("supervisor", dirs.supervisor, targetB, targetA),
    swarm: await createPair("swarm", dirs.swarms, targetB, targetA),
  };
  const operatorOutput = text(await operator.execute("latest-artifact-consumer-scope", { action: "plan", target: targetB }));
  const proofOutput = text(await proofLoop.execute("latest-artifact-consumer-scope", { action: "plan", target: targetB, maxSteps: 2, replaySteps: 1 }));
  const compilerOutput = text(await compiler.execute("latest-artifact-consumer-scope", { action: "draft", target: targetB }));
  const artifactScope = await memory.execute("latest-artifact-consumer-scope", { action: "artifact-scope-filter", query: targetB });
  writeFileSync(outPath, JSON.stringify({ kind: "LatestArtifactConsumerScopeProbeV1", tempRoot, agentDir, targetA, targetB, artifacts, operatorOutput, proofOutput, compilerOutput, artifactScopeText: text(artifactScope), artifactScope: artifactScope.details }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
`, "utf8");
}

function runProbe(tempRoot) {
  const probePath = join(tempRoot, "latest-artifact-consumer-scope-probe.ts");
  const outPath = join(tempRoot, "probe-result.json");
  writeProbe(probePath, outPath, tempRoot);
  const tsx = join(root, "node_modules", ".bin", "tsx");
  const result = spawnSync(tsx, ["--tsconfig", join(root, "tsconfig.json"), probePath], { cwd: root, env: { ...process.env, PI_OFFLINE: "1", REPI_OFFLINE: "1" }, encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
  return { ...result, outPath, probePath };
}

function main() {
  const checks = [];
  const tempRoot = mkdtempSync(join(tmpdir(), "repi-latest-artifact-consumer-scope-"));
  let probeData;
  try {
    const schema = readJson(SCHEMA_PATH);
    const fixture = readJson(FIXTURE_PATH);
    checks.push(check("schema:parse", schema?.$defs?.LatestArtifactConsumerScopeGateV1 && schema?.$defs?.LatestArtifactConsumerScopeScenarioV1, { path: SCHEMA_PATH }));
    const fixtureEval = validateFixture(fixture);
    checks.push(check("fixture:coverage", fixtureEval.missingGates.length === 0 && fixtureEval.missingScenarios.length === 0, fixtureEval));
    const probe = runProbe(tempRoot);
    checks.push(check("runtime:probe-exit", probe.status === 0, { code: probe.status, signal: probe.signal, stdoutTail: (probe.stdout ?? "").slice(-2000), stderrTail: (probe.stderr ?? "").slice(-5000) }));
    if (probe.status === 0 && existsSync(probe.outPath)) {
      probeData = JSON.parse(readFileSync(probe.outPath, "utf8"));
      const combined = [probeData.operatorOutput, probeData.proofOutput, probeData.compilerOutput].join("\n");
      const blockedPaths = Object.values(probeData.artifacts).map((pair) => pair.blocked);
      const allowedPaths = Object.values(probeData.artifacts).map((pair) => pair.allowed);
      const blockedLeaked = /TARGET_A_BLOCKED_|consumer-a\.local/i.test(combined) || blockedPaths.some((path) => combined.includes(path));
      const allowedPresent = /TARGET_B_ALLOWED_|consumer-b\.local/i.test(combined) && allowedPaths.some((path) => combined.includes(path));
      checks.push(check("runtime:operator-feedback-scope", /TARGET_B_ALLOWED_|consumer-b\.local/i.test(probeData.operatorOutput) && !/TARGET_A_BLOCKED_|consumer-a\.local/i.test(probeData.operatorOutput), { operatorTail: probeData.operatorOutput.slice(-2500) }));
      checks.push(check("runtime:proof-loop-gap-scope", /TARGET_B_ALLOWED_|consumer-b\.local/i.test(probeData.proofOutput) && !/TARGET_A_BLOCKED_|consumer-a\.local/i.test(probeData.proofOutput), { proofTail: probeData.proofOutput.slice(-2500) }));
      checks.push(check("runtime:compiler-claim-gate-scope", /TARGET_B_ALLOWED_supervisor|consumer-b\.local/i.test(probeData.compilerOutput) && !/TARGET_A_BLOCKED_|consumer-a\.local/i.test(probeData.compilerOutput), { compilerTail: probeData.compilerOutput.slice(-2500) }));
      checks.push(check("runtime:no-cross-target-latest-leak", !blockedLeaked && allowedPresent, { blockedPaths, allowedPaths }));
      checks.push(check("runtime:artifact-scope-report-blocks", (probeData.artifactScope?.quarantinedArtifacts ?? []).some((path) => /blocked-target-a/.test(path)) && (probeData.artifactScope?.allowedArtifacts ?? []).some((path) => /allowed-target-b/.test(path)), { blocked: probeData.artifactScope?.quarantinedArtifacts, allowed: probeData.artifactScope?.allowedArtifacts }));
    } else {
      for (const id of ["runtime:operator-feedback-scope", "runtime:proof-loop-gap-scope", "runtime:compiler-claim-gate-scope", "runtime:no-cross-target-latest-leak", "runtime:artifact-scope-report-blocks"]) checks.push(check(id, false, { error: "probe output missing" }));
    }
    const core = readText("packages/coding-agent/src/core/recon-profile.ts");
    checks.push(check("code:latest-consumer-markers", ["artifactTargetMatches", "operator_feedback_latest_artifact_consumer", "proof_loop_gap_latest_artifact_consumer",
  "proof_loop_evidence_latest_artifact_consumer", "compiler_claim_gate"].every((marker) => core.includes(marker)), { markers: ["artifactTargetMatches", "operator_feedback_latest_artifact_consumer"] }));
    const topHarness = readText("scripts/reverse-agent/repi-top-harness.mjs");
    checks.push(check("harness:wiring", topHarness.includes("gate:latest-artifact-consumer-scope") && topHarness.includes("child:gate:latest-artifact-consumer-scope"), { markers: ["gate:latest-artifact-consumer-scope"] }));
    const autonomy = readText("scripts/reverse-agent/autonomy-control-plane.mjs");
    checks.push(check("autonomy:wiring", autonomy.includes("LatestArtifactConsumerScopeGateV1") && autonomy.includes("latest_artifact_consumer_scope_gate"), { markers: ["LatestArtifactConsumerScopeGateV1"] }));
  } catch (error) {
    checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
  } finally {
    if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
  }
  const failed = checks.filter((row) => row.status !== "pass");
  const result = { kind: "repi-latest-artifact-consumer-scope-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), LatestArtifactConsumerScopeGateV1: true, ok: failed.length === 0, root, tempRoot: keepTmp ? tempRoot : undefined, checks };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "latest-artifact-consumer-scope", result.generatedAt.replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    if (probeData) writeFileSync(join(dir, "probe-result.json"), `${JSON.stringify(probeData, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI LatestArtifactConsumerScopeGateV1");
    for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
  }
  if (strict && failed.length) process.exit(1);
}
main();
