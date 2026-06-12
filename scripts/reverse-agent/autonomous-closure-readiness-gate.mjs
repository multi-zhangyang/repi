#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const argv = process.argv.slice(2);
const rootArg = argv.find((arg) => !arg.startsWith("-"));
const root = resolve(rootArg ?? process.cwd());
const strict = argv.includes("--strict");
const json = argv.includes("--json");
const writeEvidence = !argv.includes("--no-write");
const SCHEMA_PATH = "schemas/reverse-agent/autonomous-closure-readiness.schema.json";
const FIXTURE_PATH = "fixtures/reverse-agent/autonomous-closure-readiness.fixture.json";

const REQUIRED_GATES = [
  "closure_gate_present_in_gap_ledger",
  "closure_gate_package_script_present",
  "closure_gate_script_exists",
  "closure_gate_top_harness_child_gate",
  "closure_gate_autonomy_contract_present",
  "closure_gate_docs_present",
  "closure_gate_strict_no_write_passes",
  "top_autonomous_false_until_closed",
];
const REQUIRED_NEGATIVE_CASES = [
  "missing-package-script",
  "missing-top-harness-child-gate",
  "missing-autonomy-contract",
  "missing-docs",
  "closure-gate-run-failed",
  "top-autonomous-true-with-ready-gaps",
  "closed-gap-without-artifact-backed-row",
];
const DOC_PATHS = [
  "README.md",
  "docs/reverse-agent/README.md",
  "docs/reverse-agent/autonomous-control-plane.md",
  "packages/coding-agent/docs/recon.md",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const shortHash = (value) => sha256(value).slice(0, 24);
const check = (id, ok, evidence = {}) => ({ id, status: ok ? "pass" : "fail", evidence });
const readText = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(readText(path));
const clone = (value) => JSON.parse(JSON.stringify(value));

function markerCheck(id, path, markers) {
  const full = join(root, path);
  if (!existsSync(full)) return check(id, false, { path, exists: false });
  const text = readFileSync(full, "utf8");
  const missing = markers.filter((marker) => !text.includes(marker));
  return check(id, missing.length === 0, { path, missing, sha256: shortHash(text) });
}

function normalizeGate(gate) {
  return String(gate || "").replace(/^gate:/, "").replace(/-/g, "_");
}

function scriptPathFromNpmScript(script) {
  const match = String(script || "").match(/(scripts\/reverse-agent\/[A-Za-z0-9._-]+\.mjs)/);
  return match?.[1] ?? null;
}

function runAutonomyJson() {
  const result = spawnSync(process.execPath, ["scripts/reverse-agent/autonomy-control-plane.mjs", root, "--json"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024,
  });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {}
  return { code: result.status, stdoutTail: (result.stdout || "").slice(-2000), stderrTail: (result.stderr || "").slice(-4000), parsed };
}

function runClosureGate(scriptPath) {
  if (!scriptPath || !existsSync(join(root, scriptPath))) {
    return { code: 127, stdoutTail: "", stderrTail: "missing closure gate script", stdoutSha256: null, stderrSha256: null };
  }
  const result = spawnSync(process.execPath, [scriptPath, root, "--strict", "--no-write"], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PI_OFFLINE: "1", PI_SKIP_VERSION_CHECK: "1", REPI_SKIP_VERSION_CHECK: "1" },
    maxBuffer: 80 * 1024 * 1024,
  });
  return {
    code: result.status,
    stdoutTail: (result.stdout || "").slice(-1600),
    stderrTail: (result.stderr || "").slice(-1600),
    stdoutSha256: shortHash(result.stdout || ""),
    stderrSha256: shortHash(result.stderr || ""),
  };
}

function validateReadinessPackage(pkg) {
  const errors = [];
  if (pkg?.kind !== "AutonomousClosureReadinessGateV1") errors.push("pkg.kind");
  if (pkg?.AutonomousClosureReadinessGateV1 !== true) errors.push("pkg.AutonomousClosureReadinessGateV1");
  const gates = new Set(pkg?.requiredGates || []);
  for (const gate of REQUIRED_GATES) if (!gates.has(gate)) errors.push(`requiredGate_missing:${gate}`);
  const negativeIds = new Set((pkg?.negativeCases || []).map((row) => row.id));
  for (const id of REQUIRED_NEGATIVE_CASES) if (!negativeIds.has(id)) errors.push(`negativeCase_missing:${id}`);

  const matrix = pkg?.readinessMatrix;
  if (matrix?.kind !== "AutonomousClosureReadinessMatrixV1") errors.push("matrix.kind");
  const rows = matrix?.closureRows || [];
  if (!Array.isArray(rows) || rows.length < 1) errors.push("matrix.closureRows.minItems");
  if (matrix?.summary?.gapCount !== rows.length) errors.push("summary.gapCount_mismatch");
  const uniqueClosureGates = new Set(rows.map((row) => row.closureGate));
  if (matrix?.summary?.closureGateCount !== uniqueClosureGates.size) errors.push("summary.closureGateCount_mismatch");
  if (matrix?.sourceLedger?.gapCount !== rows.length) errors.push("sourceLedger.gapCount_mismatch");
  if (matrix?.sourceLedger?.closureGateCount !== uniqueClosureGates.size) errors.push("sourceLedger.closureGateCount_mismatch");
  if (!/^[a-f0-9]{64}$/.test(String(matrix?.sourceLedger?.gapHash || ""))) errors.push("sourceLedger.gapHash_invalid");
  if (matrix?.promotionPolicy?.mode !== "strict_closure_gate_readiness") errors.push("promotionPolicy.mode");
  if (matrix?.promotionPolicy?.topAutonomousDefinitionFalseUntilClosed !== true) errors.push("promotionPolicy.topAutonomousDefinitionFalseUntilClosed");
  if (matrix?.promotionPolicy?.readyForLiveDoesNotEqualClosed !== true) errors.push("promotionPolicy.readyForLiveDoesNotEqualClosed");
  if (matrix?.promotionPolicy?.closedRequiresArtifactBackedRows !== true) errors.push("promotionPolicy.closedRequiresArtifactBackedRows");
  if (matrix?.summary?.topAutonomousDefinition === true && rows.some((row) => row.status !== "closed")) errors.push("top_autonomous_true_with_non_closed_gap");

  let readyRows = 0;
  let closedRows = 0;
  let failedRows = 0;
  const seen = new Set();
  for (const row of rows) {
    const rowErrors = [];
    if (seen.has(row.closureGate)) rowErrors.push("duplicate_closureGate");
    seen.add(row.closureGate);
    if (!/^gate:[a-z0-9-]+$/.test(String(row.closureGate || ""))) rowErrors.push("closureGate_invalid");
    if (!String(row.scriptPath || "").startsWith("scripts/reverse-agent/") || !String(row.scriptPath || "").endsWith(".mjs")) rowErrors.push("scriptPath_invalid");
    for (const boolField of ["packageScriptPresent", "gateScriptExists", "topHarnessChildGatePresent", "autonomyContractPresent", "strictNoWritePass", "acceptanceCriteriaBacked"]) {
      if (row[boolField] !== true) rowErrors.push(`${boolField}_not_true`);
    }
    if (row.status === "ready_for_live" && row.readyForLive !== true) rowErrors.push("readyForLive_not_true_for_ready_gap");
    if (row.status === "closed" && row.artifactBackedClosure !== true) rowErrors.push("artifactBackedClosure_not_true_for_closed_gap");
    if (!Array.isArray(row.docsPresent) || row.docsPresent.length < 2) rowErrors.push("docsPresent_minItems");
    if (!Array.isArray(row.evidenceRefs) || row.evidenceRefs.length < 4) rowErrors.push("evidenceRefs_minItems");
    if (row.status === "closed" && (!Array.isArray(row.closureEvidenceRefs) || row.closureEvidenceRefs.length < 4)) rowErrors.push("closed_without_closure_evidence_refs");
    if (row.status !== "closed" && !String(row.notClosedReason || "").includes("ready_for_live")) rowErrors.push("notClosedReason_missing_ready_for_live");
    if (rowErrors.length) {
      failedRows++;
      errors.push(`${row.gapId || row.closureGate || "unknown"}:${rowErrors.join(",")}`);
    } else if (row.status === "closed") {
      closedRows++;
    } else {
      readyRows++;
    }
  }
  if (matrix?.summary?.readyRows !== readyRows) errors.push("summary.readyRows_mismatch");
  if ((matrix?.summary?.closedRows ?? 0) !== closedRows) errors.push("summary.closedRows_mismatch");
  if (matrix?.summary?.failedRows !== failedRows) errors.push("summary.failedRows_mismatch");
  if (matrix?.summary?.allClosureGatesExecutable !== rows.every((row) => row.gateScriptExists === true && row.strictNoWritePass === true)) errors.push("summary.allClosureGatesExecutable_mismatch");
  if (matrix?.summary?.allClosureGatesHarnessed !== rows.every((row) => row.packageScriptPresent === true && row.topHarnessChildGatePresent === true && row.autonomyContractPresent === true && (row.docsPresent || []).length >= 2)) errors.push("summary.allClosureGatesHarnessed_mismatch");
  return { ok: errors.length === 0, errors };
}

function mutateFixture(fixture, id) {
  const row = clone(fixture);
  const first = row.readinessMatrix.closureRows[0];
  if (id === "missing-package-script") first.packageScriptPresent = false;
  if (id === "missing-top-harness-child-gate") first.topHarnessChildGatePresent = false;
  if (id === "missing-autonomy-contract") first.autonomyContractPresent = false;
  if (id === "missing-docs") first.docsPresent = [];
  if (id === "closure-gate-run-failed") first.strictNoWritePass = false;
  if (id === "top-autonomous-true-with-ready-gaps") { row.readinessMatrix.summary.topAutonomousDefinition = true; first.status = "ready_for_live"; first.readyForLive = true; first.artifactBackedClosure = false; row.readinessMatrix.summary.closedRows = Math.max(0, (row.readinessMatrix.summary.closedRows ?? 0) - 1); row.readinessMatrix.summary.readyRows = (row.readinessMatrix.summary.readyRows ?? 0) + 1; }
  if (id === "closed-gap-without-artifact-backed-row") {
    first.status = "closed";
    first.acceptanceCriteriaBacked = false;
    first.artifactBackedClosure = false;
  }
  return row;
}

function buildReadinessMatrix(runtime) {
  const pkg = readJson("package.json");
  const topHarness = readText("scripts/reverse-agent/repi-top-harness.mjs");
  const autonomy = readText("scripts/reverse-agent/autonomy-control-plane.mjs");
  const docs = DOC_PATHS.map((path) => ({ path, text: existsSync(join(root, path)) ? readText(path) : "" }));
  const ledger = runtime.parsed?.hardeningGapLedger;
  const rows = [];
  const runResults = [];
  for (const gap of ledger?.gaps || []) {
    const closureGate = gap.closureGate;
    const npmScript = pkg.scripts?.[closureGate] || "";
    const scriptPath = scriptPathFromNpmScript(npmScript) || scriptPathFromNpmScript(gap.nextCommand) || "";
    const gateScriptExists = Boolean(scriptPath && existsSync(join(root, scriptPath)));
    const runResult = runClosureGate(scriptPath);
    runResults.push({ gapId: gap.gapId, closureGate, scriptPath, ...runResult });
    const normalized = normalizeGate(closureGate);
    const docsPresent = docs.filter((doc) => doc.text.includes(closureGate) || doc.text.includes(String(scriptPath))).map((doc) => doc.path);
    const packageScriptPresent = Boolean(pkg.scripts?.[closureGate] && npmScript.includes(String(scriptPath)));
    const topHarnessChildGatePresent = topHarness.includes(`child:${closureGate}`) && topHarness.includes(String(scriptPath));
    const autonomyContractPresent = autonomy.includes(closureGate) && autonomy.includes(normalized);
    const strictNoWritePass = runResult.code === 0;
    const acceptanceCriteriaBacked =
      packageScriptPresent &&
      gateScriptExists &&
      topHarnessChildGatePresent &&
      autonomyContractPresent &&
      docsPresent.length >= 2 &&
      strictNoWritePass &&
      Array.isArray(gap.acceptanceCriteria) &&
      gap.acceptanceCriteria.length >= 3;
    rows.push({
      gapId: gap.gapId,
      pillar: gap.pillar,
      status: gap.status,
      closureGate,
      scriptPath,
      npmScript,
      packageScriptPresent,
      gateScriptExists,
      topHarnessChildGatePresent,
      autonomyContractPresent,
      docsPresent,
      strictNoWritePass,
      acceptanceCriteriaBacked,
      readyForLive: gap.status === "ready_for_live" && acceptanceCriteriaBacked,
      artifactBackedClosure: gap.status === "closed" && acceptanceCriteriaBacked && gap.artifactBackedClosure === true && (gap.closureEvidenceRefs ?? []).length >= 4,
      closureEvidenceRefs: gap.closureEvidenceRefs ?? [],
      evidenceRefs: ["package.json", scriptPath, "scripts/reverse-agent/repi-top-harness.mjs", "scripts/reverse-agent/autonomy-control-plane.mjs", ...docsPresent].filter(Boolean),
      notClosedReason: gap.status === "closed" ? "closed" : `${gap.status} still requires broader live runtime samples before closed`,
    });
  }
  const uniqueClosureGates = new Set(rows.map((row) => row.closureGate));
  const readyRows = rows.filter((row) => row.readyForLive).length;
  const closedRows = rows.filter((row) => row.artifactBackedClosure).length;
  const failedRows = rows.length - readyRows - closedRows;
  return {
    matrix: {
      kind: "AutonomousClosureReadinessMatrixV1",
      schemaVersion: 1,
      sourceLedger: {
        kind: "AutonomousHardeningGapLedgerV1",
        gapCount: ledger?.gapCount ?? rows.length,
        closureGateCount: ledger?.closureGateCount ?? uniqueClosureGates.size,
        gapHash: ledger?.gapHash ?? "0".repeat(64),
      },
      summary: {
        gapCount: rows.length,
        closureGateCount: uniqueClosureGates.size,
        readyRows,
        closedRows,
        failedRows,
        allClosureGatesExecutable: rows.every((row) => row.gateScriptExists && row.strictNoWritePass),
        allClosureGatesHarnessed: rows.every((row) => row.packageScriptPresent && row.topHarnessChildGatePresent && row.autonomyContractPresent && row.docsPresent.length >= 2),
        topAutonomousDefinition: runtime.parsed?.topAutonomousDefinition === true,
      },
      closureRows: rows,
      promotionPolicy: {
        mode: "strict_closure_gate_readiness",
        topAutonomousDefinitionFalseUntilClosed: true,
        readyForLiveDoesNotEqualClosed: true,
        closedRequiresArtifactBackedRows: true,
      },
    },
    runResults,
  };
}

function main() {
  const checks = [];
  let runtimeMatrix = null;
  let closureRunResults = [];
  try {
    const schema = readJson(SCHEMA_PATH);
    const fixture = readJson(FIXTURE_PATH);
    checks.push(check("schema:parse", Boolean(schema?.$defs?.AutonomousClosureReadinessGateV1 && schema?.$defs?.AutonomousClosureReadinessMatrixV1), { path: SCHEMA_PATH }));
    const fixtureRequiredGates = REQUIRED_GATES.every((gate) => fixture.requiredGates?.includes(gate));
    checks.push(check("fixture:required-gates", fixtureRequiredGates, { required: REQUIRED_GATES, present: fixture.requiredGates }));
    const positive = validateReadinessPackage(fixture);
    const negativeResults = REQUIRED_NEGATIVE_CASES.map((id) => {
      const mutated = mutateFixture(fixture, id);
      const result = validateReadinessPackage(mutated);
      return { id, rejected: !result.ok, errors: result.errors };
    });
    checks.push(check("fixture:positive-readiness", positive.ok, positive));
    checks.push(check("fixture:negative-readiness", negativeResults.every((row) => row.rejected), { negativeResults }));

    const runtime = runAutonomyJson();
    checks.push(check("runtime:autonomy-json", runtime.code === 0 && Boolean(runtime.parsed?.hardeningGapLedger), { code: runtime.code, stderrTail: runtime.stderrTail, stdoutTail: runtime.stdoutTail }));
    if (runtime.parsed?.hardeningGapLedger) {
      const { matrix, runResults } = buildReadinessMatrix(runtime);
      runtimeMatrix = matrix;
      closureRunResults = runResults;
      const runtimePackage = {
        kind: "AutonomousClosureReadinessGateV1",
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        AutonomousClosureReadinessGateV1: true,
        requiredGates: REQUIRED_GATES,
        readinessMatrix: matrix,
        negativeCases: fixture.negativeCases,
        invariants: REQUIRED_GATES,
      };
      const runtimeValidation = validateReadinessPackage(runtimePackage);
      checks.push(check("runtime:closure-readiness-matrix", runtimeValidation.ok, { ...runtimeValidation, matrixSummary: matrix.summary, rows: matrix.closureRows.map(({ gapId, closureGate, readyForLive, artifactBackedClosure, strictNoWritePass, docsPresent }) => ({ gapId, closureGate, readyForLive, artifactBackedClosure, strictNoWritePass, docsPresent })) }));
      checks.push(check("runtime:all-closure-gates-strict-no-write", matrix.closureRows.every((row) => row.strictNoWritePass), { runResults }));
      checks.push(check("runtime:top-autonomous-promotion-state", runtime.parsed.topAutonomousDefinition === matrix.closureRows.every((row) => row.status === "closed" && row.artifactBackedClosure === true), { topAutonomousDefinition: runtime.parsed.topAutonomousDefinition, statuses: matrix.closureRows.map((row) => row.status), artifactBacked: matrix.closureRows.map((row) => row.artifactBackedClosure) }));
    } else {
      checks.push(check("runtime:closure-readiness-matrix", false, { error: "missing hardeningGapLedger" }));
      checks.push(check("runtime:all-closure-gates-strict-no-write", false, { error: "missing hardeningGapLedger" }));
      checks.push(check("runtime:top-autonomous-promotion-state", false, { error: "missing hardeningGapLedger" }));
    }

    checks.push(markerCheck("harness:autonomous-closure-readiness", "scripts/reverse-agent/repi-top-harness.mjs", ["gate:autonomous-closure-readiness", "AutonomousClosureReadinessGateV1", "child:gate:autonomous-closure-readiness"]));
    checks.push(markerCheck("autonomy:autonomous-closure-readiness", "scripts/reverse-agent/autonomy-control-plane.mjs", ["autonomous_closure_readiness_gate", "AutonomousClosureReadinessGateV1", "gate:autonomous-closure-readiness"]));
    checks.push(markerCheck("npm:autonomous-closure-readiness", "package.json", ["gate:autonomous-closure-readiness", "autonomous-closure-readiness-gate.mjs"]));
    checks.push(markerCheck("docs:autonomous-closure-readiness-readme", "README.md", ["AutonomousClosureReadinessGateV1", "gate:autonomous-closure-readiness"]));
    checks.push(markerCheck("docs:autonomous-closure-readiness-control-plane", "docs/reverse-agent/autonomous-control-plane.md", ["AutonomousClosureReadinessGateV1", "gate:autonomous-closure-readiness"]));
    checks.push(markerCheck("docs:autonomous-closure-readiness-recon", "packages/coding-agent/docs/recon.md", ["AutonomousClosureReadinessGateV1", "gate:autonomous-closure-readiness"]));
  } catch (error) {
    checks.push(check("gate:exception", false, { error: String(error), stack: error?.stack }));
  }
  const failed = checks.filter((row) => row.status !== "pass");
  const result = {
    kind: "repi-autonomous-closure-readiness-gate",
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    AutonomousClosureReadinessGateV1: true,
    ok: failed.length === 0,
    root,
    checks,
    readinessMatrix: runtimeMatrix,
    closureRunResults,
  };
  if (writeEvidence) {
    const dir = join(root, ".repi-harness", "evidence", "autonomous-closure-readiness", result.generatedAt.replace(/[:.]/g, "-"));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "result.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  if (json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log("# REPI AutonomousClosureReadinessGateV1");
    for (const row of checks) console.log(`- ${row.status === "pass" ? "PASS" : "FAIL"} ${row.id}`);
    console.log(`summary: ${failed.length ? "fail" : "pass"} checks=${checks.length}`);
    if (runtimeMatrix) console.log(`matrix: readyRows=${runtimeMatrix.summary.readyRows} failedRows=${runtimeMatrix.summary.failedRows} closureGateCount=${runtimeMatrix.summary.closureGateCount}`);
  }
  if (strict && failed.length) process.exit(1);
}

main();
