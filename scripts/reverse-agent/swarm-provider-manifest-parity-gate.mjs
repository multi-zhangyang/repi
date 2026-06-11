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
  "multi_provider_workers_share_claim_failure_merge_ledger",
  "provider_worker_retry_repair_rows_bound_to_worker_manifest",
  "live_provider_backed_multi_provider_shared_ledger_matrix",
  "provider_worker_retry_window_manifest_binding_chain",
  "provider_backed_long_window_shared_merge_ledger",
  "provider_worker_extended_retry_manifest_chain",
  "provider_env_refs_only",
  "runtime_artifacts_have_hashes",
  "narrative_only_provider_worker_not_promoted",
];
const REQUIRED_NEGATIVE_CASES = [
  "worker-id-mismatch",
  "claim-ref-dropped",
  "missing-runtime-hash",
  "literal-provider-secret",
  "failure-repair-unlinked",
  "single-provider-matrix",
  "shared-ledger-worker-missing",
  "retry-repair-manifest-unbound",
  "shared-ledger-window-provider-missing",
  "retry-window-nonmonotonic",
  "retry-window-manifest-drift",
  "long-shared-ledger-window-too-short",
  "extended-retry-chain-too-short",
  "long-shared-ledger-secret-leak",
];
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

function validateLiveProviderBackedSharedLedgerMatrix({ report, providerNames, rowWorkerIds, rowClaimRefs, rowFailureRepairRefs }) {
  const errors = [];
  const rows = report?.liveProviderBackedSharedLedgerMatrix || [];
  if (rows.length < 2) errors.push("liveProviderBackedSharedLedgerMatrix.minItems");
  const coveredProviders = new Set();
  const coveredWorkers = new Set();
  const coveredClaims = new Set();
  const coveredFailureRepairs = new Set();
  for (const window of rows) {
    if (window.kind !== "LiveProviderBackedSharedLedgerMatrixV1") errors.push(`${window.windowId || "window"}.kind`);
    if (window.providerBacked !== true) errors.push(`${window.windowId || "window"}.providerBacked_not_true`);
    if ((window.providerNames || []).length < 2) errors.push(`${window.windowId || "window"}.provider_count_lt_2`);
    if ((window.workerIds || []).length < 2) errors.push(`${window.windowId || "window"}.worker_count_lt_2`);
    if (window.hashChain !== true || !hasHash(window.ledgerTipSha256)) errors.push(`${window.windowId || "window"}.hash_chain_invalid`);
    if (!window.sharedClaimLedgerPath || !window.sharedFailureLedgerPath || !window.sharedRepairQueuePath) errors.push(`${window.windowId || "window"}.shared_paths_missing`);
    for (const providerName of providerNames) if (!window.providerNames?.includes(providerName)) errors.push(`${window.windowId || "window"}.provider_missing:${providerName}`);
    for (const workerId of window.workerIds || []) {
      coveredWorkers.add(workerId);
      if (!rowWorkerIds.has(workerId)) errors.push(`${window.windowId || "window"}.unknown_worker:${workerId}`);
    }
    for (const providerName of window.providerNames || []) coveredProviders.add(providerName);
    for (const claimRef of window.claimRefs || []) {
      coveredClaims.add(claimRef);
      if (!rowClaimRefs.has(claimRef)) errors.push(`${window.windowId || "window"}.unknown_claim:${claimRef}`);
    }
    for (const failureRepairRef of window.failureRepairRefs || []) {
      coveredFailureRepairs.add(failureRepairRef);
      if (!rowFailureRepairRefs.has(failureRepairRef)) errors.push(`${window.windowId || "window"}.unknown_failure_repair:${failureRepairRef}`);
    }
  }
  for (const providerName of providerNames) if (!coveredProviders.has(providerName)) errors.push(`liveProviderBackedSharedLedgerMatrix.provider_uncovered:${providerName}`);
  for (const workerId of rowWorkerIds) if (!coveredWorkers.has(workerId)) errors.push(`liveProviderBackedSharedLedgerMatrix.worker_uncovered:${workerId}`);
  for (const claimRef of rowClaimRefs) if (!coveredClaims.has(claimRef)) errors.push(`liveProviderBackedSharedLedgerMatrix.claim_uncovered:${claimRef}`);
  for (const failureRepairRef of rowFailureRepairRefs) if (!coveredFailureRepairs.has(failureRepairRef)) errors.push(`liveProviderBackedSharedLedgerMatrix.failure_repair_uncovered:${failureRepairRef}`);
  return errors;
}

function validateProviderBackedLongWindowSharedMergeLedger({ report, providerNames, rowWorkerIds, rowClaimRefs, rowFailureRepairRefs, rowByWorkerId }) {
  const errors = [];
  const ledger = report?.providerBackedLongWindowSharedMergeLedger;
  const windows = ledger?.windows || [];
  if (ledger?.kind !== "ProviderBackedLongWindowSharedMergeLedgerV1") errors.push("providerBackedLongWindowSharedMergeLedger.kind");
  if (ledger?.providerBacked !== true) errors.push("providerBackedLongWindowSharedMergeLedger.providerBacked_not_true");
  if (ledger?.envRefOnlySecrets !== true || ledger?.literalSecretsPresent !== false) errors.push("providerBackedLongWindowSharedMergeLedger.secret_policy_invalid");
  if (!hasHash(ledger?.ledgerTipSha256) || ledger?.hashChain !== true) errors.push("providerBackedLongWindowSharedMergeLedger.hash_chain_invalid");
  if ((ledger?.windowCount ?? 0) !== windows.length) errors.push("providerBackedLongWindowSharedMergeLedger.window_count_mismatch");
  if (windows.length < 4) errors.push("providerBackedLongWindowSharedMergeLedger.minWindows");
  const coveredWorkers = new Set();
  const coveredClaims = new Set();
  const coveredFailureRepairs = new Set();
  const coveredProviders = new Set();
  let prevSequence = 0;
  for (const window of windows) {
    if ((window.sequence ?? 0) <= prevSequence) errors.push(`${window.windowId || "long-window"}.sequence_not_monotonic`);
    prevSequence = window.sequence ?? prevSequence;
    if (window.providerBacked !== true) errors.push(`${window.windowId || "long-window"}.providerBacked_not_true`);
    if (window.hashChain !== true || !hasHash(window.ledgerTipSha256)) errors.push(`${window.windowId || "long-window"}.hash_chain_invalid`);
    if (window.envRefOnlySecrets !== true || window.literalSecretsPresent !== false) errors.push(`${window.windowId || "long-window"}.secret_policy_invalid`);
    if (!window.sharedClaimLedgerPath || !window.sharedFailureLedgerPath || !window.sharedRepairQueuePath) errors.push(`${window.windowId || "long-window"}.shared_paths_missing`);
    for (const providerName of providerNames) if (!window.providerNames?.includes(providerName)) errors.push(`${window.windowId || "long-window"}.provider_missing:${providerName}`);
    for (const providerName of window.providerNames || []) coveredProviders.add(providerName);
    if ((window.workerIds || []).length < 2) errors.push(`${window.windowId || "long-window"}.worker_count_lt_2`);
    if ((window.manifestRefs || []).length < (window.workerIds || []).length) errors.push(`${window.windowId || "long-window"}.manifest_refs_missing`);
    const manifestRefs = new Map((window.manifestRefs || []).map((ref) => [ref.workerId, ref]));
    for (const workerId of window.workerIds || []) {
      coveredWorkers.add(workerId);
      const parityRow = rowByWorkerId.get(workerId);
      const manifestRef = manifestRefs.get(workerId);
      if (!parityRow) errors.push(`${window.windowId || "long-window"}.unknown_worker:${workerId}`);
      if (!manifestRef) errors.push(`${window.windowId || "long-window"}.manifest_ref_missing:${workerId}`);
      if (manifestRef && parityRow) {
        if (manifestRef.runtimeManifestFile !== parityRow.runtimeManifestFile) errors.push(`${window.windowId || "long-window"}.manifest_file_mismatch:${workerId}`);
        if (manifestRef.runtimeManifestSha256 !== parityRow.runtimeManifestSha256 || !hasHash(manifestRef.runtimeManifestSha256)) errors.push(`${window.windowId || "long-window"}.manifest_hash_mismatch:${workerId}`);
      }
    }
    for (const claimRef of window.claimRefs || []) {
      coveredClaims.add(claimRef);
      if (!rowClaimRefs.has(claimRef)) errors.push(`${window.windowId || "long-window"}.unknown_claim:${claimRef}`);
    }
    for (const failureRepairRef of window.failureRepairRefs || []) {
      coveredFailureRepairs.add(failureRepairRef);
      if (!rowFailureRepairRefs.has(failureRepairRef)) errors.push(`${window.windowId || "long-window"}.unknown_failure_repair:${failureRepairRef}`);
    }
  }
  for (const providerName of providerNames) if (!coveredProviders.has(providerName)) errors.push(`providerBackedLongWindowSharedMergeLedger.provider_uncovered:${providerName}`);
  for (const workerId of rowWorkerIds) if (!coveredWorkers.has(workerId)) errors.push(`providerBackedLongWindowSharedMergeLedger.worker_uncovered:${workerId}`);
  for (const claimRef of rowClaimRefs) if (!coveredClaims.has(claimRef)) errors.push(`providerBackedLongWindowSharedMergeLedger.claim_uncovered:${claimRef}`);
  for (const failureRepairRef of rowFailureRepairRefs) if (!coveredFailureRepairs.has(failureRepairRef)) errors.push(`providerBackedLongWindowSharedMergeLedger.failure_repair_uncovered:${failureRepairRef}`);
  const text = JSON.stringify(ledger || {});
  if (/ghp_[A-Za-z0-9]|github_pat_[A-Za-z0-9]|sk-[A-Za-z0-9]{8,}/i.test(text)) errors.push("providerBackedLongWindowSharedMergeLedger.literal_secret_leak");
  return errors;
}

function validateRetryWindowManifestBindingChain({ report, rowByWorkerId, rowFailureRepairRefs }) {
  const errors = [];
  const chain = report?.retryWindowManifestBindingChain;
  if (chain?.kind !== "ProviderWorkerRetryWindowManifestBindingChainV1") errors.push("retryWindowManifestBindingChain.kind");
  if (!chain?.sharedRetryLedgerPath || chain?.hashChain !== true || !hasHash(chain?.ledgerTipSha256)) errors.push("retryWindowManifestBindingChain.ledger_invalid");
  const windows = chain?.retryWindows || [];
  if (windows.length < 2) errors.push("retryWindowManifestBindingChain.minWindows");
  const providerNames = new Set();
  for (const window of windows) {
    const parityRow = rowByWorkerId.get(window.workerId);
    if (!parityRow) {
      errors.push(`${window.windowId || "retry-window"}.worker_missing:${window.workerId || ""}`);
      continue;
    }
    providerNames.add(window.providerName);
    if (window.runtimeManifestFile !== parityRow.runtimeManifestFile) errors.push(`${window.workerId}.retryWindow.runtimeManifestFile_mismatch`);
    if (window.runtimeManifestSha256 !== parityRow.runtimeManifestSha256 || !hasHash(window.runtimeManifestSha256)) errors.push(`${window.workerId}.retryWindow.runtimeManifestSha256_mismatch`);
    if (window.retrySignature !== parityRow.retryBudget?.signature) errors.push(`${window.workerId}.retryWindow.signature_mismatch`);
    if (window.providerName !== parityRow.providerName || window.modelId !== parityRow.modelId) errors.push(`${window.workerId}.retryWindow.provider_mismatch`);
    if (!window.regressionGate) errors.push(`${window.workerId}.retryWindow.regression_missing`);
    if (window.manifestBound !== true || window.monotonicAttempts !== true) errors.push(`${window.workerId}.retryWindow.binding_flags_invalid`);
    let prevAttempt = 0;
    const attempts = window.attemptRows || [];
    if (attempts.length < 2) errors.push(`${window.workerId}.retryWindow.attempt_count_lt_2`);
    for (const attempt of attempts) {
      if (attempt.attempt <= prevAttempt) errors.push(`${window.workerId}.retryWindow.attempt_not_monotonic:${attempt.attempt}`);
      prevAttempt = attempt.attempt;
      if (attempt.runtimeManifestFile !== parityRow.runtimeManifestFile) errors.push(`${window.workerId}.retryWindow.attempt_manifest_file_mismatch:${attempt.attempt}`);
      if (attempt.runtimeManifestSha256 !== parityRow.runtimeManifestSha256 || !hasHash(attempt.runtimeManifestSha256)) errors.push(`${window.workerId}.retryWindow.attempt_manifest_hash_mismatch:${attempt.attempt}`);
      if (attempt.retrySignature !== parityRow.retryBudget?.signature) errors.push(`${window.workerId}.retryWindow.attempt_signature_mismatch:${attempt.attempt}`);
      if (!rowFailureRepairRefs.has(attempt.failureRef) || !rowFailureRepairRefs.has(attempt.repairRef)) errors.push(`${window.workerId}.retryWindow.failure_repair_ref_mismatch:${attempt.attempt}`);
      if (!attempt.rollbackPolicyRef || !attempt.regressionGate || attempt.regressionGate !== window.regressionGate) errors.push(`${window.workerId}.retryWindow.regression_binding_missing:${attempt.attempt}`);
    }
    const terminal = attempts.at(-1);
    if (window.terminalStatus !== terminal?.status) errors.push(`${window.workerId}.retryWindow.terminal_status_mismatch`);
    if (!["repaired", "exhausted", "escalated"].includes(window.terminalStatus)) errors.push(`${window.workerId}.retryWindow.terminal_status_invalid`);
  }
  if (providerNames.size < 2) errors.push("retryWindowManifestBindingChain.provider_count_lt_2");
  return errors;
}

function validateProviderWorkerExtendedRetryManifestChain({ report, rowByWorkerId, rowFailureRepairRefs }) {
  const errors = [];
  const chain = report?.providerWorkerExtendedRetryManifestChain;
  if (chain?.kind !== "ProviderWorkerExtendedRetryManifestChainV1") errors.push("providerWorkerExtendedRetryManifestChain.kind");
  if (!chain?.sharedRetryLedgerPath || chain?.hashChain !== true || !hasHash(chain?.ledgerTipSha256)) errors.push("providerWorkerExtendedRetryManifestChain.ledger_invalid");
  if (chain?.envRefOnlySecrets !== true || chain?.literalSecretsPresent !== false) errors.push("providerWorkerExtendedRetryManifestChain.secret_policy_invalid");
  const windows = chain?.retryWindows || [];
  if (windows.length < 2) errors.push("providerWorkerExtendedRetryManifestChain.minWindows");
  let totalAttempts = 0;
  const providerNames = new Set();
  const signatures = new Set();
  for (const window of windows) {
    const parityRow = rowByWorkerId.get(window.workerId);
    if (!parityRow) {
      errors.push(`${window.windowId || "extended-retry-window"}.worker_missing:${window.workerId || ""}`);
      continue;
    }
    providerNames.add(window.providerName);
    signatures.add(window.retrySignature);
    if (window.providerName !== parityRow.providerName || window.modelId !== parityRow.modelId) errors.push(`${window.workerId}.extendedRetry.provider_mismatch`);
    if (window.runtimeManifestFile !== parityRow.runtimeManifestFile) errors.push(`${window.workerId}.extendedRetry.runtimeManifestFile_mismatch`);
    if (window.runtimeManifestSha256 !== parityRow.runtimeManifestSha256 || !hasHash(window.runtimeManifestSha256)) errors.push(`${window.workerId}.extendedRetry.runtimeManifestSha256_mismatch`);
    if (window.retrySignature !== parityRow.retryBudget?.signature) errors.push(`${window.workerId}.extendedRetry.signature_mismatch`);
    if (window.manifestBound !== true || window.monotonicAttempts !== true || window.sameSignatureAcrossAttempts !== true) errors.push(`${window.workerId}.extendedRetry.binding_flags_invalid`);
    const attempts = window.attemptRows || [];
    totalAttempts += attempts.length;
    if (attempts.length < 3) errors.push(`${window.workerId}.extendedRetry.attempt_count_lt_3`);
    let prevAttempt = 0;
    for (const attempt of attempts) {
      if (attempt.attempt <= prevAttempt) errors.push(`${window.workerId}.extendedRetry.attempt_not_monotonic:${attempt.attempt}`);
      prevAttempt = attempt.attempt;
      if (attempt.runtimeManifestFile !== parityRow.runtimeManifestFile) errors.push(`${window.workerId}.extendedRetry.attempt_manifest_file_mismatch:${attempt.attempt}`);
      if (attempt.runtimeManifestSha256 !== parityRow.runtimeManifestSha256 || !hasHash(attempt.runtimeManifestSha256)) errors.push(`${window.workerId}.extendedRetry.attempt_manifest_hash_mismatch:${attempt.attempt}`);
      if (attempt.retrySignature !== parityRow.retryBudget?.signature) errors.push(`${window.workerId}.extendedRetry.attempt_signature_mismatch:${attempt.attempt}`);
      if (!rowFailureRepairRefs.has(attempt.failureRef) || !rowFailureRepairRefs.has(attempt.repairRef)) errors.push(`${window.workerId}.extendedRetry.failure_repair_ref_mismatch:${attempt.attempt}`);
      if (!attempt.rollbackPolicyRef || !attempt.regressionGate || attempt.regressionGate !== window.regressionGate) errors.push(`${window.workerId}.extendedRetry.regression_binding_missing:${attempt.attempt}`);
      if (attempt.manifestBound !== true) errors.push(`${window.workerId}.extendedRetry.attempt_not_manifest_bound:${attempt.attempt}`);
    }
    const terminal = attempts.at(-1);
    if (window.terminalStatus !== terminal?.status) errors.push(`${window.workerId}.extendedRetry.terminal_status_mismatch`);
    if (!["repaired", "exhausted", "escalated"].includes(window.terminalStatus)) errors.push(`${window.workerId}.extendedRetry.terminal_status_invalid`);
  }
  if (providerNames.size < 2) errors.push("providerWorkerExtendedRetryManifestChain.provider_count_lt_2");
  if (signatures.size < 2) errors.push("providerWorkerExtendedRetryManifestChain.signature_count_lt_2");
  if (totalAttempts < 7) errors.push("providerWorkerExtendedRetryManifestChain.total_attempts_lt_7");
  if ((chain?.totalAttemptRows ?? 0) !== totalAttempts) errors.push("providerWorkerExtendedRetryManifestChain.total_attempts_mismatch");
  const text = JSON.stringify(chain || {});
  if (/ghp_[A-Za-z0-9]|github_pat_[A-Za-z0-9]|sk-[A-Za-z0-9]{8,}/i.test(text)) errors.push("providerWorkerExtendedRetryManifestChain.literal_secret_leak");
  return errors;
}

function validateParityPackage(pkg) {
  const errors = [];
  const report = pkg.parityReport;
  const manifest = pkg.swarmManifest;
  const childSession = pkg.childSession?.sessions?.[0];
  const provider = pkg.providerWorker;
  const sharedLedger = report?.sharedMergeLedger;
  const retryRepairBindings = report?.retryRepairBindings || [];
  if (report?.kind !== "SwarmProviderManifestParityReportV1") errors.push("parityReport.kind");
  if (report?.closureGate !== "gate:swarm-provider-manifest-parity") errors.push("parityReport.closureGate");
  const rows = report?.parityRows || [];
  if (rows.length < 2) errors.push("parityRows.minItems");
  const providerNames = new Set();
  const rowWorkerIds = new Set();
  const rowClaimRefs = new Set();
  const rowFailureRepairRefs = new Set();
  const rowByWorkerId = new Map();
  for (const row of rows) {
    if (!row.workerId) errors.push("row.workerId_missing");
    else {
      rowWorkerIds.add(row.workerId);
      rowByWorkerId.set(row.workerId, row);
    }
    if (!row.runtimeManifestFile) errors.push(`${row.workerId}.runtimeManifestFile_missing`);
    if (!hasHash(row.runtimeManifestSha256)) errors.push(`${row.workerId}.runtimeManifestSha256_missing`);
    if (!row.sessionDir) errors.push(`${row.workerId}.sessionDir_missing`);
    if (!row.providerName || !row.modelId) errors.push(`${row.workerId}.provider_missing`);
    if (row.providerName) providerNames.add(row.providerName);
    if (!row.claimRefs?.length) errors.push(`${row.workerId}.claimRefs_missing`);
    for (const claimRef of row.claimRefs || []) rowClaimRefs.add(claimRef);
    for (const failureRepairRef of row.failureRepairRefs || []) rowFailureRepairRefs.add(failureRepairRef);
    if (!hasHash(row.hashes?.stdoutSha256) || !hasHash(row.hashes?.stderrSha256) || !hasHash(row.hashes?.transcriptSha256)) errors.push(`${row.workerId}.hashes_missing`);
    if (!row.retryBudget?.signature || row.retryBudget?.exhausted === true || (row.retryBudget?.remaining ?? -1) < 0) errors.push(`${row.workerId}.retryBudget_invalid`);
    if (!row.ledgerPaths?.claimLedgerPath || !row.ledgerPaths?.failureLedgerPath || !row.ledgerPaths?.repairQueuePath) errors.push(`${row.workerId}.ledgerPaths_missing`);
    for (const [key, ok] of Object.entries(row.parityChecks || {})) if (ok !== true) errors.push(`${row.workerId}.parityCheck_failed:${key}`);
    if (row.promotionAllowed && !row.parityChecks?.providerEnvRefsOnly) errors.push(`${row.workerId}.promotion_without_env_ref`);
    if (row.promotionAllowed && row.failureRepairRefs?.length) errors.push(`${row.workerId}.failure_worker_promoted`);
  }
  if (providerNames.size < 2) errors.push("multi_provider_workers_share_claim_failure_merge_ledger.provider_count_lt_2");
  if (sharedLedger?.kind !== "SwarmProviderSharedMergeLedgerV1") errors.push("sharedMergeLedger.kind");
  if (!sharedLedger?.claimLedgerPath || !sharedLedger?.failureLedgerPath || !sharedLedger?.repairQueuePath) errors.push("sharedMergeLedger.paths_missing");
  if (!hasHash(sharedLedger?.ledgerTipSha256) || sharedLedger?.hashChain !== true) errors.push("sharedMergeLedger.hash_chain_invalid");
  for (const providerName of providerNames) if (!sharedLedger?.providerNames?.includes(providerName)) errors.push(`sharedMergeLedger.provider_missing:${providerName}`);
  for (const workerId of rowWorkerIds) if (!sharedLedger?.workerIds?.includes(workerId)) errors.push(`sharedMergeLedger.worker_missing:${workerId}`);
  for (const claimRef of rowClaimRefs) if (!sharedLedger?.claimRefs?.includes(claimRef)) errors.push(`sharedMergeLedger.claim_missing:${claimRef}`);
  for (const failureRepairRef of rowFailureRepairRefs) if (!sharedLedger?.failureRepairRefs?.includes(failureRepairRef)) errors.push(`sharedMergeLedger.failure_repair_missing:${failureRepairRef}`);
  errors.push(...validateLiveProviderBackedSharedLedgerMatrix({ report, providerNames, rowWorkerIds, rowClaimRefs, rowFailureRepairRefs }));
  errors.push(...validateProviderBackedLongWindowSharedMergeLedger({ report, providerNames, rowWorkerIds, rowClaimRefs, rowFailureRepairRefs, rowByWorkerId }));

  const failureRows = rows.filter((row) => row.failureRepairRefs?.length);
  if (failureRows.length < 1) errors.push("provider_worker_retry_repair_rows_bound_to_worker_manifest.no_failure_rows");
  for (const row of failureRows) {
    const failureRefs = new Set(row.failureRepairRefs || []);
    const bindings = retryRepairBindings.filter((binding) => binding.workerId === row.workerId);
    if (bindings.length < 1) {
      errors.push(`${row.workerId}.retryRepairBinding_missing`);
      continue;
    }
    for (const binding of bindings) {
      if (binding.runtimeManifestFile !== row.runtimeManifestFile) errors.push(`${row.workerId}.retryRepairBinding.runtimeManifestFile_mismatch`);
      if (binding.runtimeManifestSha256 !== row.runtimeManifestSha256 || !hasHash(binding.runtimeManifestSha256)) errors.push(`${row.workerId}.retryRepairBinding.runtimeManifestSha256_mismatch`);
      if (binding.providerName !== row.providerName || binding.modelId !== row.modelId) errors.push(`${row.workerId}.retryRepairBinding.provider_mismatch`);
      if (binding.retrySignature !== row.retryBudget?.signature) errors.push(`${row.workerId}.retryRepairBinding.retrySignature_mismatch`);
      if (!failureRefs.has(binding.failureRef) || !failureRefs.has(binding.repairRef)) errors.push(`${row.workerId}.retryRepairBinding.failureRepairRef_mismatch`);
      if (!binding.rollbackPolicyRef || !binding.regressionGate) errors.push(`${row.workerId}.retryRepairBinding.rollback_or_regression_missing`);
    }
  }
  errors.push(...validateRetryWindowManifestBindingChain({ report, rowByWorkerId, rowFailureRepairRefs }));
  errors.push(...validateProviderWorkerExtendedRetryManifestChain({ report, rowByWorkerId, rowFailureRepairRefs }));
  if (manifest && provider) {
    if (manifest.workerId !== provider.workerId) errors.push("manifest_provider.workerId_mismatch");
    if (manifest.stdoutSha256 !== provider.stdoutSha256 || manifest.stderrSha256 !== provider.stderrSha256) errors.push("manifest_provider.hash_mismatch");
    if (manifest.runtimeManifestSha256 !== provider.runtimeManifestSha256 || !hasHash(provider.runtimeManifestSha256)) errors.push("manifest_provider.runtimeManifestSha256_mismatch");
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
  if (id === "single-provider-matrix") {
    for (const parityRow of row.parityReport.parityRows) parityRow.providerName = "parallel-openai-compatible";
    row.parityReport.sharedMergeLedger.providerNames = ["parallel-openai-compatible"];
  }
  if (id === "shared-ledger-worker-missing") row.parityReport.sharedMergeLedger.workerIds = row.parityReport.sharedMergeLedger.workerIds.filter((workerId) => workerId !== "worker-beta-anthropic-pass");
  if (id === "retry-repair-manifest-unbound") row.parityReport.retryRepairBindings[0].retrySignature = "re_swarm:other-worker";
  if (id === "shared-ledger-window-provider-missing") row.parityReport.liveProviderBackedSharedLedgerMatrix[0].providerNames = row.parityReport.liveProviderBackedSharedLedgerMatrix[0].providerNames.filter((providerName) => providerName !== "parallel-anthropic-compatible");
  if (id === "retry-window-nonmonotonic") row.parityReport.retryWindowManifestBindingChain.retryWindows[0].attemptRows[1].attempt = 1;
  if (id === "retry-window-manifest-drift") row.parityReport.retryWindowManifestBindingChain.retryWindows[0].attemptRows[1].runtimeManifestSha256 = "4444444444444444444444444444444444444444444444444444444444444444";
  if (id === "long-shared-ledger-window-too-short") row.parityReport.providerBackedLongWindowSharedMergeLedger.windows = row.parityReport.providerBackedLongWindowSharedMergeLedger.windows.slice(0, 1);
  if (id === "extended-retry-chain-too-short") row.parityReport.providerWorkerExtendedRetryManifestChain.retryWindows[0].attemptRows = row.parityReport.providerWorkerExtendedRetryManifestChain.retryWindows[0].attemptRows.slice(0, 2);
  if (id === "long-shared-ledger-secret-leak") row.parityReport.providerBackedLongWindowSharedMergeLedger.windows[0].sharedClaimLedgerPath = "ghp_deadbeef";
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
    checks.push(check("fixture:live-provider-backed-shared-ledger-matrix", (fixture.parityReport.liveProviderBackedSharedLedgerMatrix || []).length >= 2 && fixture.parityReport.liveProviderBackedSharedLedgerMatrix.every((row) => row.providerBacked === true && row.providerNames.length >= 2 && row.hashChain === true), { liveProviderBackedSharedLedgerMatrix: fixture.parityReport.liveProviderBackedSharedLedgerMatrix }));
    checks.push(check("fixture:retry-window-manifest-binding-chain", fixture.parityReport.retryWindowManifestBindingChain?.retryWindows?.length >= 2 && fixture.parityReport.retryWindowManifestBindingChain.retryWindows.every((row) => row.manifestBound === true && row.monotonicAttempts === true && row.attemptRows.length >= 2), { retryWindowManifestBindingChain: fixture.parityReport.retryWindowManifestBindingChain }));
    checks.push(check("fixture:provider-backed-long-window-shared-merge-ledger", fixture.parityReport.providerBackedLongWindowSharedMergeLedger?.windows?.length >= 4 && fixture.parityReport.providerBackedLongWindowSharedMergeLedger.windows.every((row) => row.providerBacked === true && row.providerNames.length >= 2 && row.hashChain === true && row.envRefOnlySecrets === true), { providerBackedLongWindowSharedMergeLedger: fixture.parityReport.providerBackedLongWindowSharedMergeLedger }));
    checks.push(check("fixture:provider-worker-extended-retry-manifest-chain", fixture.parityReport.providerWorkerExtendedRetryManifestChain?.retryWindows?.length >= 2 && fixture.parityReport.providerWorkerExtendedRetryManifestChain.totalAttemptRows >= 7 && fixture.parityReport.providerWorkerExtendedRetryManifestChain.retryWindows.every((row) => row.manifestBound === true && row.monotonicAttempts === true && row.sameSignatureAcrossAttempts === true && row.attemptRows.length >= 3), { providerWorkerExtendedRetryManifestChain: fixture.parityReport.providerWorkerExtendedRetryManifestChain }));
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
    checks.push(markerCheck("harness:swarm-provider-manifest-parity", "scripts/reverse-agent/repi-top-harness.mjs", ["gate:swarm-provider-manifest-parity", "SwarmProviderManifestParityGateV1", "ProviderBackedLongWindowSharedMergeLedgerV1", "ProviderWorkerExtendedRetryManifestChainV1", "child:gate:swarm-provider-manifest-parity"]));
    checks.push(markerCheck("autonomy:swarm-provider-manifest-parity", "scripts/reverse-agent/autonomy-control-plane.mjs", ["swarm_provider_manifest_parity_gate", "SwarmProviderManifestParityGateV1", "gate:swarm-provider-manifest-parity", "SwarmProviderSharedMergeLedgerV1", "SwarmProviderRetryRepairBindingV1", "ProviderBackedLongWindowSharedMergeLedgerV1", "ProviderWorkerExtendedRetryManifestChainV1"]));
    checks.push(markerCheck("npm:swarm-provider-manifest-parity", "package.json", ["gate:swarm-provider-manifest-parity", "swarm-provider-manifest-parity-gate.mjs"]));
    checks.push(markerCheck("docs:swarm-provider-manifest-parity-readme", "README.md", ["SwarmProviderManifestParityGateV1", "gate:swarm-provider-manifest-parity", "multi-provider", "retry/repair", "ProviderBackedLongWindowSharedMergeLedgerV1", "ProviderWorkerExtendedRetryManifestChainV1"]));
    checks.push(markerCheck("docs:swarm-provider-manifest-parity-control-plane", "docs/reverse-agent/autonomous-control-plane.md", ["SwarmProviderManifestParityGateV1", "gate:swarm-provider-manifest-parity", "multi-provider", "retry/repair", "ProviderBackedLongWindowSharedMergeLedgerV1", "ProviderWorkerExtendedRetryManifestChainV1"]));
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
