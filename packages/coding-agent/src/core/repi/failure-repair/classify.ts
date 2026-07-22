/** Failure signature/category classification. */

export {
	configureFailureRepair,
	d,
	latestProofLoopArtifactPath,
	operatorFeedbackCategory,
	operatorFeedbackFallbackCommands,
	runtimeArtifactHashes,
} from "./classify-deps.ts";
export {
	appendText,
	bumpRuntimeFailureSummary,
	rebuildRuntimeFailureSummaryFromLedger,
	rotateRuntimeFailureLedgerIfNeeded,
	rotateRuntimeRepairQueueIfNeeded,
	runtimeFailureAttempt,
	runtimeFailureLedgerMaxRows,
	runtimeFailurePriority,
	runtimeFailureTargetMatches,
	runtimeRepairAction,
	runtimeRepairQueueMaxRows,
	runtimeRepairTargetMatches,
} from "./classify-ops.ts";
export {
	failureToRepair,
	isFailureLedgerEvent,
	isRepairQueueItem,
	reverseFailureNextCommands,
	runtimeFailureCategory,
	runtimeFailureSignature,
} from "./classify-pure.ts";
