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
const keepTmp = argv.includes("--keep-tmp") || process.env.KEEP_REPI_MULTI_COMPACT_PRESSURE_TMP === "1";
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/multi-compact-pressure.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/multi-compact-pressure.fixture.json";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));

const REQUIRED_GATES = [
  "MultiCompactPressureGateV1",
  "multi_compact_append_only_pressure",
  "old_context_path_over_latest_fallback",
  "duplicate_resume_idempotency_replay",
  "auto_resume_budget_exhaustion_pressure",
  "scope_artifact_drift_negative_cases",
  "operator_proof_loop_compact_writeback",
];

function check(id, status, evidence = {}) {
  return { id, status: status ? "pass" : "fail", evidence };
}

function normalizeCommand(command = "") {
  return command.trim().replace(/^\//, "").replace(/^re-/i, "re_").replace(/\s+/g, " ");
}

function transitionHash(row) {
  return sha256([
    row.prevHash,
    row.at,
    `${row.from}->${row.to}`,
    row.idempotencyKey,
    normalizeCommand(row.command ?? ""),
    row.contextPath ?? "",
    row.contextSha256 ?? "",
    `${row.attempt}/${row.maxAttempts}`,
    row.reason,
  ].join("\n"));
}

function verifyTransitionHashes(transitionPath) {
  const errors = [];
  const text = readFileSync(transitionPath, "utf8");
  let previousText = "";
  let rows = 0;
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    rows += 1;
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      errors.push(`row ${index + 1} corrupt`);
      previousText += `${line}\n`;
      continue;
    }
    const expectedPrevHash = previousText.trim() ? sha256(previousText) : "0".repeat(64);
    if (row.prevHash !== expectedPrevHash) errors.push(`prevHash drift row ${index + 1}`);
    const { entryHash, ...base } = row;
    const expectedEntryHash = transitionHash(base);
    if (entryHash !== expectedEntryHash) errors.push(`entryHash drift row ${index + 1}`);
    previousText += `${line}\n`;
  }
  return { rows, errors };
}

function validateFixture(fixture) {
  const gates = new Set(fixture.requiredGates ?? []);
  const negativeIds = new Set((fixture.negativeCases ?? []).map((row) => row.id));
  const validIds = new Set((fixture.validScenarios ?? []).map((row) => row.id));
  return {
    kind: fixture.kind,
    missingGates: REQUIRED_GATES.filter((gate) => !gates.has(gate)),
    missingValidScenarios: ["two-independent-compact-cycles", "old-context-path-beats-latest", "duplicate-resume-idempotent", "operator-proof-loop-writeback"].filter((id) => !validIds.has(id)),
    missingNegativeCases: ["target-unresolved", "latest-fallback-without-explicit-ref", "scope-mismatch", "artifact-drift", "budget-exhausted"].filter((id) => !negativeIds.has(id)),
    hasRuntimePlan: fixture.runtimePressurePlan?.kind === "MultiCompactPressureGateV1",
  };
}

function validateProbeData(probeData) {
  const errors = [];
  if (probeData?.kind !== "MultiCompactPressureProbeV1") errors.push("probe kind mismatch");
  if (!Array.isArray(probeData?.cycles) || probeData.cycles.length < 2) errors.push("expected at least two compact/resume cycles");
  if (!probeData?.oldContext?.resume?.pack?.resumedFromContextPath) errors.push("old context resume did not record resumedFromContextPath");
  if (probeData?.duplicateReplay?.transitionCountBefore !== probeData?.duplicateReplay?.transitionCountAfter) errors.push("duplicate replay appended transitions");
  if (!probeData?.finalReport?.CompactResumeLedgerV2) errors.push("final CompactResumeLedgerV2 report missing");
  if ((probeData?.finalReport?.invalidTransitions ?? []).length !== 0) errors.push("final report has invalid transitions");
  return errors;
}

function cycleRows(report, cycle) {
  const key = cycle?.pack?.pack?.idempotencyKey;
  if (!key) return [];
  return (report.transitions ?? []).filter((row) => row.idempotencyKey === key);
}

function rowPath(rows) {
  return rows.map((row) => `${row.from}->${row.to}`);
}

function writeProbe(probePath, outPath, tempRoot) {
  const importUrl = pathToFileURL(join(root, "packages/coding-agent/src/core/recon-profile.ts")).href;
  writeFileSync(probePath, `
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createReconExtensionFactory } from ${JSON.stringify(importUrl)};

const outPath = ${JSON.stringify(outPath)};
const tempRoot = ${JSON.stringify(tempRoot)};
const agentDir = join(tempRoot, "agent");
const workspace = join(tempRoot, "workspace");
mkdirSync(agentDir, { recursive: true });
mkdirSync(workspace, { recursive: true });
process.chdir(workspace);
process.env.REPI_CODING_AGENT_DIR = agentDir;
process.env.REPI_SESSION_ID = "multi-compact-pressure-session";
process.env.REPI_BRANCH_ID = "multi-compact-pressure-branch";
process.env.REPI_PRODUCT = "1";
process.env.PI_RECON_PRODUCT = "1";

const tools = new Map();
const hooks = new Map();
const entries = [];
const sentMessages = [];
const fakeCtx = { hasUI: false, ui: { setStatus() {}, notify() {} } };
const fakePi = {
  registerCommand() {},
  registerTool(tool) { tools.set(tool.name, tool); },
  on(name, handler) {
    if (!hooks.has(name)) hooks.set(name, []);
    hooks.get(name).push(handler);
  },
  appendEntry(type, payload) { entries.push({ type, payload }); },
  getSessionName: () => undefined,
  setSessionName() {},
  sendMessage(message, options) { sentMessages.push({ message, options }); },
  exec: async () => ({ code: 0, stdout: "multi-compact-pressure-probe", stderr: "", killed: false }),
};
createReconExtensionFactory()(fakePi);
const context = tools.get("re_context");
const memory = tools.get("re_memory");
const operator = tools.get("re_operator");
const proofLoop = tools.get("re_proof_loop");
if (!context || !memory || !operator || !proofLoop) throw new Error("missing required REPI tools");

function text(result) { return result?.content?.[0]?.text ?? ""; }
function artifactPath(output) {
  const match = /^context_artifact:\s*(.+)$/m.exec(output);
  if (!match?.[1]) throw new Error("missing context artifact in " + output.slice(0, 1000));
  return match[1].trim();
}
function parsePack(path) {
  const body = readFileSync(path, "utf8");
  const fence = String.fromCharCode(96).repeat(3);
  const start = body.indexOf(fence + "json");
  const contentStart = body.indexOf("\\n", start);
  const end = body.indexOf(fence, contentStart + 1);
  return JSON.parse(body.slice(contentStart + 1, end).trim());
}
function snapshotRequiredArtifacts(pack) {
  return (pack.pack.artifactHashes ?? [])
    .filter((artifact) => artifact.required && artifact.path && existsSync(artifact.path))
    .map((artifact) => ({ path: artifact.path, body: readFileSync(artifact.path, "utf8") }));
}
function restoreRequiredArtifacts(snapshot) {
  for (const artifact of snapshot) writeFileSync(artifact.path, artifact.body, "utf8");
}
async function pack(target) {
  const output = text(await context.execute("multi-compact-pressure", { action: "pack", target }));
  const path = artifactPath(output);
  return { target, output, path, pack: parsePack(path) };
}
async function resume(contextPath, target) {
  const output = text(await context.execute("multi-compact-pressure", { action: "resume", contextPath, target }));
  const path = artifactPath(output);
  return { target, output, path, pack: parsePack(path) };
}
async function ledger() {
  const result = await memory.execute("multi-compact-pressure", { action: "compact-resume" });
  return { text: text(result), details: result.details };
}
async function callHook(name, event, ctx = fakeCtx) {
  const handlers = hooks.get(name) ?? [];
  if (!handlers.length) throw new Error("missing hook " + name);
  let last;
  for (const handler of handlers) last = await handler(event, ctx);
  return last;
}
async function runCompactionHooks(target) {
  await pack(target);
  const event = {
    preparation: {
      tokensBefore: 128000,
      firstKeptEntryId: "entry-after-pressure-compact",
      messagesToSummarize: [{ role: "user", content: "pressure compact" }],
      turnPrefixMessages: [],
      isSplitTurn: false,
      previousSummary: "previous compact summary",
    },
    branchEntries: [],
    customInstructions: "multi compact pressure hook probe",
  };
  const before = await callHook("session_before_compact", event);
  const compactionEntry = {
    id: "multi-compact-pressure-compaction-entry",
    summary: before?.compaction?.summary,
    details: before?.compaction?.details,
    firstKeptEntryId: event.preparation.firstKeptEntryId,
    tokensBefore: event.preparation.tokensBefore,
  };
  await callHook("session_compact", { compactionEntry, fromExtension: true }, fakeCtx);
  return { before, compactionEntry };
}

async function main() {
  const cycles = [];
  const oldPack = await pack("https://multi-compact-a.local");
  const oldArtifactSnapshot = snapshotRequiredArtifacts(oldPack);
  const latestPack = await pack("https://multi-compact-latest.local");
  restoreRequiredArtifacts(oldArtifactSnapshot);
  const oldResume = await resume(oldPack.path, "https://multi-compact-a.local");
  cycles.push({ id: "cycle-old-context", pack: oldPack, resume: oldResume });

  restoreRequiredArtifacts(oldArtifactSnapshot);
  const duplicateBefore = (await ledger()).details.transitions.length;
  const duplicateResume = await resume(oldPack.path, "https://multi-compact-a.local");
  const duplicateAfterLedger = await ledger();
  const duplicateAfter = duplicateAfterLedger.details.transitions.length;

  const secondPack = await pack("https://multi-compact-c.local");
  const secondResume = await resume(secondPack.path, "https://multi-compact-c.local");
  cycles.push({ id: "cycle-second", pack: secondPack, resume: secondResume });

  const missingContextPath = join(tempRoot, "missing-context-does-not-exist.md");
  const missingResume = await resume(missingContextPath, "https://missing-context.local");

  const scopePack = await pack("https://scope-a.local");
  const scopeMismatch = await resume(scopePack.path, "https://scope-b.local");

  const driftPack = await pack("https://artifact-drift.local");
  const driftArtifact = driftPack.pack.artifactHashes?.find((item) => item.required && item.path && existsSync(item.path));
  if (driftArtifact?.path) writeFileSync(driftArtifact.path, readFileSync(driftArtifact.path, "utf8") + "\\n# multi compact pressure drift\\n", "utf8");
  const driftResume = await resume(driftPack.path, "https://artifact-drift.local");

  const compactionHooks = await runCompactionHooks("https://operator-proof-writeback.local");
  const operatorOutput = text(await operator.execute("multi-compact-pressure", { action: "dispatch", target: "https://operator-proof-writeback.local", maxSteps: 4 }));
  const proofOutput = text(await proofLoop.execute("multi-compact-pressure", { action: "run", target: "https://operator-proof-writeback.local", maxSteps: 2, replaySteps: 1 }));
  const finalLedger = await ledger();
  const telemetryRows = (finalLedger.details.transitions ?? []).filter((row) => row.command === "compact_resume_telemetry");

  const result = {
    kind: "MultiCompactPressureProbeV1",
    tempRoot,
    agentDir,
    cycles,
    latestPack: { path: latestPack.path, target: latestPack.target, idempotencyKey: latestPack.pack.idempotencyKey },
    oldContext: {
      pack: { path: oldPack.path, target: oldPack.target, idempotencyKey: oldPack.pack.idempotencyKey },
      latestPathAtResume: latestPack.path,
      resume: oldResume,
    },
    duplicateReplay: {
      transitionCountBefore: duplicateBefore,
      transitionCountAfter: duplicateAfter,
      resume: duplicateResume,
    },
    negatives: {
      targetUnresolved: missingResume,
      scopeMismatch,
      artifactDrift: { driftArtifact, resume: driftResume },
    },
    compactionHooks: {
      compactionEntry: compactionHooks.compactionEntry,
      entries: entries.map((row) => row.type),
      sentMessages,
      operatorOutputTail: operatorOutput.slice(-3000),
      proofOutputTail: proofOutput.slice(-3000),
      telemetryRows,
    },
    finalReport: finalLedger.details,
    ledgerText: finalLedger.text,
  };
  writeFileSync(outPath, JSON.stringify(result, null, 2));
}
main().catch((error) => { console.error(error); process.exit(1); });
`, "utf8");
}

function runProbe(tempRoot) {
  const probePath = join(tempRoot, "multi-compact-pressure-probe.ts");
  const outPath = join(tempRoot, "probe-result.json");
  writeProbe(probePath, outPath, tempRoot);
  const tsx = join(root, "node_modules", ".bin", "tsx");
  const result = spawnSync(tsx, ["--tsconfig", join(root, "tsconfig.json"), probePath], {
    cwd: root,
    env: { ...process.env, PI_OFFLINE: "1", REPI_OFFLINE: "1", PI_SKIP_VERSION_CHECK: "1", PI_SKIP_PACKAGE_UPDATE_CHECK: "1" },
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024,
  });
  return { ...result, outPath, probePath };
}

function main() {
  const checks = [];
  const tempRoot = mkdtempSync(join(tmpdir(), "repi-multi-compact-pressure-"));
  let probeData;
  try {
    const schema = readJson(SCHEMA_PATH);
    const fixture = readJson(FIXTURE_PATH);
    checks.push(check("schema:parse", schema?.$defs?.MultiCompactPressureReportV1 && schema?.$defs?.MultiCompactPressureNegativeCaseV1, { path: SCHEMA_PATH }));
    const fixtureEval = validateFixture(fixture);
    checks.push(check("fixture:coverage", fixture.kind === "repi-multi-compact-pressure-fixture" && fixtureEval.missingGates.length === 0 && fixtureEval.missingValidScenarios.length === 0 && fixtureEval.missingNegativeCases.length === 0 && fixtureEval.hasRuntimePlan, fixtureEval));

    const probe = runProbe(tempRoot);
    checks.push(check("runtime:probe-exit", probe.status === 0, { code: probe.status, signal: probe.signal, stdoutTail: (probe.stdout ?? "").slice(-2000), stderrTail: (probe.stderr ?? "").slice(-5000) }));
    if (probe.status === 0 && existsSync(probe.outPath)) {
      probeData = JSON.parse(readFileSync(probe.outPath, "utf8"));
      const probeErrors = validateProbeData(probeData);
      const finalReport = probeData.finalReport;
      const hashCheck = verifyTransitionHashes(finalReport.transitionPath);
      const cyclePaths = probeData.cycles.map((cycle) => ({ id: cycle.id, path: rowPath(cycleRows(finalReport, cycle)), rows: cycleRows(finalReport, cycle).length }));
      const oldContext = probeData.oldContext;
      const negatives = probeData.negatives;
      const telemetryRows = probeData.compactionHooks.telemetryRows ?? [];

      checks.push(check("runtime:report-contract", probeErrors.length === 0 && finalReport.kind === "repi-compact-resume-ledger-v2-report" && finalReport.CompactResumeLedgerV2 === true, { probeErrors, reportPath: finalReport.reportPath }));
      checks.push(check("runtime:multi-cycle-append-only", hashCheck.errors.length === 0 && hashCheck.rows >= 12 && cyclePaths.every((cycle) => cycle.path.includes("queued->queued") && cycle.path.includes("queued->running") && cycle.path.includes("running->done")), { hashCheck, cyclePaths }));
      checks.push(check("runtime:old-context-path-beats-latest", oldContext.resume.pack.resumedFromContextPath === oldContext.pack.path && oldContext.resume.pack.resumedFromContextPath !== oldContext.latestPathAtResume && oldContext.resume.pack.exactResumeVerification?.loadedBy === "contextPath", { expected: oldContext.pack.path, latest: oldContext.latestPathAtResume, loadedBy: oldContext.resume.pack.exactResumeVerification?.loadedBy, resumedFrom: oldContext.resume.pack.resumedFromContextPath }));
      checks.push(check("runtime:duplicate-resume-idempotent", probeData.duplicateReplay.transitionCountBefore === probeData.duplicateReplay.transitionCountAfter, probeData.duplicateReplay));
      checks.push(check("runtime:context-pack-embeds-ledger", probeData.cycles.every((cycle) => cycle.pack.pack.compactResumeLedgerV2?.CompactResumeLedgerV2 === true && cycle.resume.pack.compactResumeLedgerV2?.CompactResumeLedgerV2 === true) && /compact_resume_ledger_v2/i.test(probeData.ledgerText), { cycleCount: probeData.cycles.length }));
      checks.push(check("negative:target-unresolved", negatives.targetUnresolved.pack.exactResumeVerification?.loadedBy === "missing" && (negatives.targetUnresolved.pack.exactResumeVerification?.blocked ?? []).some((item) => /context pack not found/i.test(item)), { verification: negatives.targetUnresolved.pack.exactResumeVerification }));
      checks.push(check("negative:scope-mismatch", negatives.scopeMismatch.pack.resumeQueueStatus === "blocked" && (negatives.scopeMismatch.pack.exactResumeVerification?.blocked ?? []).some((item) => /target mismatch/i.test(item)), { verification: negatives.scopeMismatch.pack.exactResumeVerification }));
      checks.push(check("negative:artifact-drift", negatives.artifactDrift.driftArtifact?.path && negatives.artifactDrift.resume.pack.resumeQueueStatus === "blocked" && (negatives.artifactDrift.resume.pack.exactResumeVerification?.blocked ?? []).some((item) => /artifact hash drift/i.test(item)), { driftArtifact: negatives.artifactDrift.driftArtifact, verification: negatives.artifactDrift.resume.pack.exactResumeVerification }));
      checks.push(check("runtime:operator-proof-writeback", telemetryRows.length >= 1 && probeData.compactionHooks.entries.includes("pi-recon-compaction-resume-telemetry") && probeData.compactionHooks.sentMessages.some((row) => row.message?.customType === "pi-recon-auto-resume"), { telemetryRows: telemetryRows.map((row) => `${row.from}->${row.to}:${row.command}`), entries: probeData.compactionHooks.entries, sentMessages: probeData.compactionHooks.sentMessages.length }));
    } else {
      for (const id of ["runtime:report-contract", "runtime:multi-cycle-append-only", "runtime:old-context-path-beats-latest", "runtime:duplicate-resume-idempotent", "runtime:context-pack-embeds-ledger", "negative:target-unresolved", "negative:scope-mismatch", "negative:artifact-drift", "runtime:operator-proof-writeback"]) checks.push(check(id, false, { error: "probe output missing" }));
    }

    const topHarness = readText("scripts/reverse-agent/repi-top-harness.mjs");
    const autonomy = readText("scripts/reverse-agent/autonomy-control-plane.mjs");
    const packageJson = readText("package.json");
    checks.push(check("harness:wiring", ["gate:multi-compact-pressure", "compact:multi-compact-pressure-hard-eval", "child:gate:multi-compact-pressure"].every((marker) => topHarness.includes(marker)) && packageJson.includes("gate:multi-compact-pressure"), { markers: ["gate:multi-compact-pressure", "child:gate:multi-compact-pressure"] }));
    checks.push(check("autonomy:wiring", ["multi_compact_pressure_gate", "MultiCompactPressureGateV1", "old_context_path_over_latest_fallback", "operator_proof_loop_compact_writeback"].every((marker) => autonomy.includes(marker)), { markers: ["multi_compact_pressure_gate", "MultiCompactPressureGateV1"] }));
  } catch (error) {
    checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
  } finally {
    if (!keepTmp) rmSync(tempRoot, { recursive: true, force: true });
  }

  const failed = checks.filter((row) => row.status !== "pass");
  const result = {
    kind: "repi-multi-compact-pressure-gate",
    schemaVersion: 1,
    MultiCompactPressureGateV1: true,
    generatedAt: new Date().toISOString(),
    ok: failed.length === 0,
    root,
    tempRoot: keepTmp ? tempRoot : undefined,
    checks,
  };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "multi-compact-pressure", result.generatedAt.replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
    if (probeData) writeFileSync(join(dir, "probe-result.json"), `${JSON.stringify(probeData, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI MultiCompactPressureGateV1");
    for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
  }
  if (strict && failed.length) process.exit(1);
}

main();
