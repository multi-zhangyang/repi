/** Failure-repair types. */
export type RuntimeFailureSource =
	| "re_replayer"
	| "re_autofix"
	| "re_operator"
	| "re_proof_loop"
	| "re_runtime"
	| "re_swarm"
	| "manual";

export type RuntimeFailureCategory = "tool_missing" | "artifact_stale" | "contract_gap" | "runtime_failed";

export type RuntimeFailureStatus =
	| "failed"
	| "repair_queued"
	| "exhausted"
	| "blocked"
	| "rolled_back"
	| "open"
	| "resolved";

export type RuntimeRepairAction = "refresh-context" | "recapture-evidence" | "escalate" | "replace-command" | "rerun";

export type FailureRepairArtifactHash = {
	path: string;
	sha256: string;
};

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

export type RepairQueueItemV1 = {
	repairId: string;
	fromFailureId: string;
	signature: string;
	scope: string;
	action: RuntimeRepairAction;
	repairAction: RuntimeRepairAction;
	commands: string[];
	expectedArtifacts: string[];
	expectedChecks: string[];
	preconditions: { liveAllowed: boolean; providerAllowed: boolean; requiredSecrets: string[] };
	paused: boolean;
	allowlist: string[];
	rollbackCriteria: { baseline: string; mustRestore: string[]; verificationCommand: string };
	blockedConditions: Array<{ reason: string; unblock: string }>;
	evidenceWriteback: FailureRepairEvidenceWriteback;
	regressionChecks: string[];
};

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

export type FailureRepairDeps = {
	latestProofLoopArtifactPath: (...args: any[]) => any;
	operatorFeedbackCategory: (...args: any[]) => any;
	operatorFeedbackFallbackCommands: (...args: any[]) => any;
	runtimeArtifactHashes: (...args: any[]) => any;
	[key: string]: any;
};
