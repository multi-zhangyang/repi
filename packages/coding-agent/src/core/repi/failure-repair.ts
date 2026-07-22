/**
 * Runtime failure ledger / repair queue helpers.
 * Implementation under ./failure-repair/*.
 */

export {
	appendText,
	bumpRuntimeFailureSummary,
	configureFailureRepair,
	d,
	failureToRepair,
	isFailureLedgerEvent,
	isRepairQueueItem,
	latestProofLoopArtifactPath,
	operatorFeedbackCategory,
	operatorFeedbackFallbackCommands,
	rebuildRuntimeFailureSummaryFromLedger,
	rotateRuntimeFailureLedgerIfNeeded,
	rotateRuntimeRepairQueueIfNeeded,
	runtimeArtifactHashes,
	runtimeFailureAttempt,
	runtimeFailureCategory,
	runtimeFailureLedgerMaxRows,
	runtimeFailurePriority,
	runtimeFailureSignature,
	runtimeFailureTargetMatches,
	runtimeRepairAction,
	runtimeRepairQueueMaxRows,
	runtimeRepairTargetMatches,
} from "./failure-repair/classify.ts";
export {
	appendFailureRepairLedger,
	appendRuntimeFailureInputs,
	appendRuntimeFailureRepairFromAutofix,
	appendRuntimeFailureRepairFromOperator,
	appendRuntimeFailureRepairFromReplay,
	failureRepairEvidenceWriteback,
	readRuntimeFailureLedgerRows,
	readRuntimeFailureSummary,
	readRuntimeRepairQueueRows,
} from "./failure-repair/ledger.ts";
export {
	buildRuntimeFailureRepair,
	failureSignaturePriorityReport,
} from "./failure-repair/report.ts";
export type {
	FailureLedgerEventV1,
	FailureRepairEvidenceWriteback,
	RepairQueueItemV1,
	RuntimeFailureRepairInput,
} from "./failure-repair/types.ts";
