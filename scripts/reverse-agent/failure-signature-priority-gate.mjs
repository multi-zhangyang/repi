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
const keepTmp = argv.includes("--keep-tmp") || process.env.KEEP_REPI_FAILURE_SIGNATURE_PRIORITY_TMP === "1";
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/failure-signature-priority.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/failure-signature-priority.fixture.json";
const REQUIRED_GATES = [
  "FailureSignaturePriorityGateV1",
  "proof_loop_failure_signature_priority",
  "knowledge_graph_failure_signature_priority",
  "runtime_failure_ledger_preempts_blind_retry",
  "repair_queue_ready_command_required",
  "target_scoped_failure_signature_priority",
];
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));
const check = (id, ok, evidence = {}) => ({ id, status: ok ? "pass" : "fail", evidence });
const textOf = (result) => result?.content?.[0]?.text ?? "";

function validateFixture(fixture) {
  const gates = new Set(fixture.requiredGates ?? []);
  const scenarios = new Set((fixture.scenarios ?? []).map((row) => row.id));
  return {
    missingGates: REQUIRED_GATES.filter((gate) => !gates.has(gate)),
    missingScenarios: [
      "exhausted-failure-preempts-operator-feedback",
      "repeated-failure-promotes-repair-command",
      "unrelated-target-failure-does-not-leak",
      "missing-repair-command-is-not-ready",
    ].filter((id) => !scenarios.has(id)),
  };
}

function writeProbe(probePath, outPath, tempRoot) {
  const importUrl = pathToFileURL(join(root, "packages/coding-agent/src/core/recon-profile.ts")).href;
  writeFileSync(probePath, `
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createReconExtensionFactory } from ${JSON.stringify(importUrl)};

const outPath = ${JSON.stringify(outPath)};
const tempRoot = ${JSON.stringify(tempRoot)};
const target = "https://failure-priority.target.local/app";
const unrelatedTarget = "https://unrelated-failure.local/app";
const agentDir = join(tempRoot, "agent");
const workspace = join(tempRoot, "workspace");
const recon = join(agentDir, "recon");
const failureDir = join(recon, "evidence", "failures");
const repairDir = join(recon, "evidence", "repairs");
const compilerDir = join(recon, "evidence", "compilers");
const artifactDir = join(workspace, "artifacts");
for (const dir of [agentDir, workspace, recon, failureDir, repairDir, compilerDir, artifactDir]) mkdirSync(dir, { recursive: true });
process.chdir(workspace);
process.env.REPI_CODING_AGENT_DIR = agentDir;
process.env.REPI_SESSION_ID = "failure-signature-priority-session";
process.env.REPI_BRANCH_ID = "failure-signature-priority-branch";
process.env.REPI_PRODUCT = "1";
process.env.PI_RECON_PRODUCT = "1";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const textOf = (result) => result?.content?.[0]?.text ?? "";
const ts = (offset) => new Date(Date.UTC(2026, 5, 11, 12, 0, offset)).toISOString();
function failure({ id, signature, attempt, maxAttempts = 3, status, scope, targetRef = target, category = "runtime_failed", source = "re_proof_loop", command = "re_replayer run", marker = "" }) {
  const artifactPath = join(artifactDir, signature + ".md");
  writeFileSync(artifactPath, "# " + signature + "\\n" + targetRef + "\\n" + marker + "\\n", "utf8");
  return {
    id,
    ts: ts(attempt),
    source,
    scope,
    category,
    signature,
    attempt,
    maxAttempts,
    status,
    failedGates: ["proof_loop", "runtime_replay"],
    artifacts: [{ path: artifactPath, sha256: digest(artifactPath + signature), tier: "runtime" }],
    artifactHashes: [{ path: artifactPath, sha256: digest(signature) }],
    repairId: "repair:runtime:" + signature.slice(0, 16),
    budget: { retryKey: signature, remainingAttempts: Math.max(0, maxAttempts - attempt), exhaustedAction: "re_operator escalate " + targetRef },
    retryBudget: { retryKey: signature, remainingAttempts: Math.max(0, maxAttempts - attempt), exhaustedAction: "re_operator escalate " + targetRef },
    evidenceWriteback: { failureLedgerPath: join(failureDir, "ledger.jsonl"), repairQueuePath: join(repairDir, "queue.jsonl"), appendOnly: true, mode: "runtime" },
    blockedConditions: [{ reason: marker || "runtime failure", unblock: command + " " + targetRef }],
    rollback: { required: false, baseline: digest("baseline" + signature), allowlist: [artifactPath], criteria: ["proof_loop"], restored: false },
  };
}
function repair({ signature, fromFailureId, scope, commandList, action = "recapture-evidence", paused = false, targetRef = target }) {
  return {
    repairId: "repair:runtime:" + signature.slice(0, 16),
    fromFailureId,
    signature,
    scope,
    action,
    repairAction: action,
    commands: commandList,
    expectedArtifacts: [join(artifactDir, signature + ".md")],
    expectedGates: ["verifier_matrix_ready", "proof_loop_ready"],
    preconditions: { liveAllowed: false, providerAllowed: false, requiredSecrets: [] },
    paused,
    allowlist: [join(artifactDir, signature + ".md")],
    rollbackCriteria: { baseline: digest("baseline" + signature), mustRestore: [join(artifactDir, signature + ".md")], verificationCommand: "re_proof_loop run " + targetRef + " 4 2" },
    blockedConditions: [{ reason: commandList.length ? "queued repair" : "missing repair command", unblock: commandList[0] || "add concrete repair command" }],
    evidenceWriteback: { failureLedgerPath: join(failureDir, "ledger.jsonl"), repairQueuePath: join(repairDir, "queue.jsonl"), appendOnly: true, mode: "runtime" },
    regressionGates: ["verifier_matrix_ready", "proof_loop_ready"],
  };
}
const exhausted = failure({ id: "fail:exhausted:3", signature: "aaaa1111failureexhausted", attempt: 3, status: "exhausted", scope: "proof-loop " + target, command: "re_autofix plan", marker: "EXHAUSTED_TARGET_FAILURE" });
const repeatedOne = failure({ id: "fail:repeat:1", signature: "bbbb2222failurerepeated", attempt: 1, status: "repair_queued", scope: "replayer " + target, command: "re_supervisor repair", marker: "REPEATED_TARGET_FAILURE_1" });
const repeatedTwo = failure({ id: "fail:repeat:2", signature: "bbbb2222failurerepeated", attempt: 2, status: "repair_queued", scope: "replayer " + target, command: "re_supervisor repair", marker: "REPEATED_TARGET_FAILURE_2" });
const missingCommand = failure({ id: "fail:missing:1", signature: "cccc3333missingcommand", attempt: 1, status: "repair_queued", scope: "autofix " + target, command: "re_autofix plan", marker: "MISSING_REPAIR_COMMAND" });
const unrelated = failure({ id: "fail:unrelated:3", signature: "dddd4444unrelatedleak", attempt: 3, status: "exhausted", scope: "proof-loop " + unrelatedTarget, targetRef: unrelatedTarget, command: "re_autofix plan", marker: "UNRELATED_LEAK_DO_NOT_USE" });
writeFileSync(join(failureDir, "ledger.jsonl"), [exhausted, repeatedOne, repeatedTwo, missingCommand, unrelated].map((row) => JSON.stringify(row)).join("\\n") + "\\n", "utf8");
writeFileSync(join(repairDir, "queue.jsonl"), [
  repair({ signature: exhausted.signature, fromFailureId: exhausted.id, scope: exhausted.scope, commandList: ["re_autofix plan " + target, "re_replayer run " + target + " 1"] }),
  repair({ signature: repeatedTwo.signature, fromFailureId: repeatedTwo.id, scope: repeatedTwo.scope, commandList: ["re_supervisor repair " + target, "re_proof_loop run " + target + " 4 2"], action: "replace-command" }),
  repair({ signature: missingCommand.signature, fromFailureId: missingCommand.id, scope: missingCommand.scope, commandList: [] }),
  repair({ signature: unrelated.signature, fromFailureId: unrelated.id, scope: unrelated.scope, commandList: ["re_autofix plan " + unrelatedTarget], targetRef: unrelatedTarget }),
].map((row) => JSON.stringify(row)).join("\\n") + "\\n", "utf8");
const fence = String.fromCharCode(96).repeat(3);
const compilerArtifact = {
  timestamp: ts(40), missionId: "failure-signature-priority", route: "Security general", target,
  mode: "draft", verifierArtifact: undefined, operatorFeedback: ["category=runtime_failure status=queued next=re_operator dispatch " + target + " 1 evidence=ORDINARY_OPERATOR_FEEDBACK"],
  evidenceSummary: [], gaps: ["ordinary compiler gap"], contradictions: [], claims: [], statusSummary: { proved: 0, weak: 0, contradicted: 0, missing: 1 },
  releaseGateMetadata: [], claimGatePolicy: [], claimGateResult: [], strictClaimGate: { status: "missing", requiredGaps: [] },
  structuredClaimMergeGate: { status: "missing", claimCount: 0, conflictCount: 0, evidenceMissingCount: 0, claimLedgerPath: "" },
  nextOperatorQueue: ["re_operator dispatch " + target + " 1"], sourceArtifacts: [],
};
writeFileSync(join(compilerDir, "2026-06-11-000-failure-priority-compiler.md"), ["# Compiler", "", "failure priority compiler", "", "## JSON", "", fence + "json", JSON.stringify(compilerArtifact, null, 2), fence, ""].join("\\n"), "utf8");
const tools = new Map();
const fakePi = { registerCommand() {}, registerTool(tool) { tools.set(tool.name, tool); }, on() {}, appendEntry() {}, getSessionName: () => undefined, setSessionName() {}, sendMessage() {}, exec: async () => ({ code: 0, stdout: "failure-signature-priority", stderr: "", killed: false }) };
createReconExtensionFactory()(fakePi);
const proofLoop = tools.get("re_proof_loop");
const knowledge = tools.get("re_knowledge_graph");
if (!proofLoop || !knowledge) throw new Error("missing proof-loop/knowledge tools");
async function main() {
  const proofOutput = textOf(await proofLoop.execute("failure-signature-priority", { action: "plan", target, maxSteps: 3, replaySteps: 1 }));
  const knowledgeOutput = textOf(await knowledge.execute("failure-signature-priority", { action: "build", target }));
  writeFileSync(outPath, JSON.stringify({ kind: "FailureSignaturePriorityProbeV1", tempRoot, agentDir, target, unrelatedTarget, proofOutput, knowledgeOutput }, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
`, "utf8");
}

function runProbe(tempRoot) {
  const probePath = join(tempRoot, "failure-signature-priority-probe.ts");
  const outPath = join(tempRoot, "probe-result.json");
  writeProbe(probePath, outPath, tempRoot);
  const tsx = join(root, "node_modules", ".bin", "tsx");
  const result = spawnSync(tsx, ["--tsconfig", join(root, "tsconfig.json"), probePath], { cwd: root, env: { ...process.env, PI_OFFLINE: "1", REPI_OFFLINE: "1" }, encoding: "utf8", maxBuffer: 80 * 1024 * 1024 });
  return { ...result, outPath, probePath };
}

function markerCheck(id, path, markers) {
  const full = join(root, path);
  if (!existsSync(full)) return check(id, false, { path, exists: false });
  const body = readFileSync(full, "utf8");
  const missing = markers.filter((marker) => !body.includes(marker));
  return check(id, missing.length === 0, { path, missing, sha256: sha256(body).slice(0, 24) });
}

function main() {
  const checks = [];
  const tempRoot = mkdtempSync(join(tmpdir(), "repi-failure-signature-priority-"));
  let probeData;
  try {
    const schema = readJson(SCHEMA_PATH);
    const fixture = readJson(FIXTURE_PATH);
    checks.push(check("schema:parse", schema?.$defs?.FailureSignaturePriorityGateV1 && schema?.$defs?.FailureSignaturePriorityScenarioV1, { path: SCHEMA_PATH }));
    const fixtureEval = validateFixture(fixture);
    checks.push(check("fixture:coverage", fixtureEval.missingGates.length === 0 && fixtureEval.missingScenarios.length === 0, fixtureEval));
    const probe = runProbe(tempRoot);
    checks.push(check("runtime:probe-exit", probe.status === 0, { code: probe.status, signal: probe.signal, stdoutTail: (probe.stdout ?? "").slice(-2000), stderrTail: (probe.stderr ?? "").slice(-5000) }));
    if (probe.status === 0 && existsSync(probe.outPath)) {
      probeData = JSON.parse(readFileSync(probe.outPath, "utf8"));
      const proof = probeData.proofOutput;
      const knowledge = probeData.knowledgeOutput;
      const firstFailure = proof.indexOf("failure_signature_priority status=exhausted");
      const firstOperator = proof.indexOf("\noperator_feedback:\n");
      checks.push(check("runtime:proof-loop-failure-priority", /failure_signature_priority status=exhausted[\s\S]*next=re_autofix plan https:\/\/failure-priority\.target\.local\/app/.test(proof) && firstFailure >= 0 && (firstOperator < 0 || firstFailure < firstOperator), { firstFailure, firstOperator, proofTail: proof.slice(-3500) }));
      checks.push(check("runtime:proof-loop-repeated-repair", /failure_signature_priority status=repair_queued[\s\S]*repeats=2[\s\S]*next=re_supervisor repair https:\/\/failure-priority\.target\.local\/app/.test(proof), { proofTail: proof.slice(-3500) }));
      checks.push(check("runtime:missing-repair-not-ready", /failure_signature_repair_queue[\s\S]*signature=cccc3333missing[\s\S]*ready=false[\s\S]*commands=missing/.test(proof) && !/next=missing/i.test(proof), { proofTail: proof.slice(-3500) }));
      checks.push(check("runtime:no-unrelated-target-leak", !/UNRELATED_LEAK_DO_NOT_USE|unrelated-failure\.local|dddd4444unrelated/i.test(proof + "\n" + knowledge), { target: probeData.target, unrelated: probeData.unrelatedTarget }));
      checks.push(check("runtime:knowledge-consumes-failure-signature", /failure_signature_priority:/i.test(knowledge) && /failure_signature_repair_queue:/i.test(knowledge) && /re_autofix plan https:\/\/failure-priority\.target\.local\/app/.test(knowledge) && /failure_signature_exhausted=1/.test(knowledge), { knowledgeTail: knowledge.slice(-3500) }));
      checks.push(check("runtime:source-artifacts-ledger-queue", /evidence\/failures\/ledger\.jsonl/.test(proof + "\n" + knowledge) && /evidence\/repairs\/queue\.jsonl/.test(proof + "\n" + knowledge), {}));
    } else {
      for (const id of ["runtime:proof-loop-failure-priority", "runtime:proof-loop-repeated-repair", "runtime:missing-repair-not-ready", "runtime:no-unrelated-target-leak", "runtime:knowledge-consumes-failure-signature", "runtime:source-artifacts-ledger-queue"]) checks.push(check(id, false, { error: "probe output missing" }));
    }
    checks.push(markerCheck("code:failure-signature-priority-runtime", "packages/coding-agent/src/core/recon-profile.ts", ["failureSignaturePriorityReport", "failureSignaturePriority", "failureSignatureRepairQueue", "failure_signature_priority", "runtimeRepairTargetMatches"]));
    checks.push(markerCheck("harness:failure-signature-priority", "scripts/reverse-agent/repi-top-harness.mjs", ["gate:failure-signature-priority", "FailureSignaturePriorityGateV1", "child:gate:failure-signature-priority"]));
    checks.push(markerCheck("autonomy:failure-signature-priority", "scripts/reverse-agent/autonomy-control-plane.mjs", ["failure_signature_priority_gate", "FailureSignaturePriorityGateV1", "runtime_failure_ledger_preempts_blind_retry"]));
    checks.push(markerCheck("docs:failure-signature-priority", "README.md", ["FailureSignaturePriorityGateV1", "gate:failure-signature-priority"]));
  } catch (error) {
    checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
  } finally {
    if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
  }
  const failed = checks.filter((row) => row.status !== "pass");
  const result = { kind: "repi-failure-signature-priority-gate", schemaVersion: 1, generatedAt: new Date().toISOString(), FailureSignaturePriorityGateV1: true, ok: failed.length === 0, root, tempRoot: keepTmp ? tempRoot : undefined, checks };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "failure-signature-priority", result.generatedAt.replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    if (probeData) writeFileSync(join(dir, "probe-result.json"), `${JSON.stringify(probeData, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI FailureSignaturePriorityGateV1");
    for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
  }
  if (strict && failed.length) process.exit(1);
}
main();
