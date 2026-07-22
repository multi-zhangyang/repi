import type { RunAutoDecision } from "../auto-lane/types.ts";
import type { LaneCommandPack } from "../lane-commands/types.ts";
import type { FailureRepairArtifactHash } from "../swarm-claim-ledger/types.ts";
/** Runtime types: failure. */
export type RuntimeFailureSource = "re_replayer" | "re_autofix" | "re_operator" | "re_proof_loop";
export type RuntimeFailureCategory = "artifact_stale" | "runtime_failed" | "tool_missing" | "contract_gap";
export type RuntimeFailureStatus = "failed" | "repair_queued" | "exhausted" | "blocked" | "rolled_back";
export type RuntimeRepairAction =
	| "rerun"
	| "replace-command"
	| "recapture-evidence"
	| "refresh-context"
	| "escalate"
	| "rollback";
export type FailureRepairEvidenceWriteback = {
	failureLedgerPath: string;
	repairQueuePath: string;
	appendOnly: true;
	mode: "runtime";
};
export type FailureLedgerEventV1 = {
	id: string;
	ts: string;
	source: RuntimeFailureSource;
	scope: string;
	category: RuntimeFailureCategory;
	signature: string;
	attempt: number;
	maxAttempts: number;
	status: RuntimeFailureStatus;
	failedChecks: string[];
	artifacts: FailureRepairArtifactHash[];
	artifactHashes: Array<{ path: string; sha256: string }>;
	repairId: string;
	budget: { retryKey: string; remainingAttempts: number; exhaustedAction: string };
	retryBudget: { retryKey: string; remainingAttempts: number; exhaustedAction: string };
	evidenceWriteback: FailureRepairEvidenceWriteback;
	blockedConditions: Array<{ reason: string; unblock: string }>;
	rollback: { required: boolean; baseline: string; allowlist: string[]; criteria: string[]; restored: boolean };
};
// RepairRollbackPolicyV1 runtime wiring: runtime:repair-rollback-live-wiring repairRollbackPolicyPath baseline/allowlist/regression/rollback.
// ToolCallTraceLedgerV1 append-only tool trace: runtime:tool-call-trace-ledger-written runtime:tool-call-trace-secret-redaction replayable_tool_result_hashes.
export type ToolCallTraceEventV1 = {
	kind: "ToolCallTraceEventV1";
	schemaVersion: 1;
	eventId: string;
	ts: string;
	missionId?: string;
	toolCallId: string;
	toolName: string;
	phase: "call" | "result";
	status: "running" | "pass" | "error" | "blocked" | "cancelled";
	inputSha256: string;
	inputPreviewRedacted: string;
	commandPreviewRedacted?: string;
	outputSha256?: string;
	outputPreviewRedacted?: string;
	detailsSha256?: string;
	replay: {
		available: boolean;
		command?: string;
		redacted: true;
		deterministic: boolean;
	};
	assertions: {
		toolCallIdPresent: boolean;
		inputHashed: boolean;
		outputHashed: boolean;
		secretRedacted: boolean;
		replayHintPresent: boolean;
		appendOnlyHashChain: boolean;
	};
	prevHash: string;
	eventHash: string;
};
export type ToolCallTraceLedgerV1 = {
	kind: "ToolCallTraceLedgerV1";
	schemaVersion: 1;
	generatedAt: string;
	ledgerPath: string;
	eventCount: number;
	callCount: number;
	resultCount: number;
	errorCount: number;
	hashChainOk: boolean;
	secretRedactionOk: boolean;
	replayCoverage: number;
	events: ToolCallTraceEventV1[];
};
// WorkerLeaseSchedulerV1 stale lease recovery: runtime:worker-lease-scheduler-validation runtime:worker-lease-stale-recovery runtime:worker-lease-scheduler-live-wiring duplicate_completion_rejected.
export type RuntimeFailureRepairInput = {
	source: RuntimeFailureSource;
	scope: string;
	target?: string;
	reason: string;
	category?: RuntimeFailureCategory;
	status?: RuntimeFailureStatus;
	commands?: string[];
	failedChecks: string[];
	sourceArtifacts: string[];
	expectedArtifacts?: string[];
	maxAttempts?: number;
	unblock?: string;
};
export type AutopilotExecutionStrategy = {
	mode: "direct" | "tool-index-missing" | "degraded" | "blocked";
	pack: LaneCommandPack;
	missingTools: string[];
	fallbacks: Array<{ label: string; missing: string[]; command: string }>;
	skipped: Array<{ label: string; missing: string[]; command: string }>;
	notes: string[];
};
export type ToolBootstrapClosure = {
	text: string;
	decision: RunAutoDecision;
	nextLane?: string;
};
