/**
 * Pure proof-loop gap classification and quick-plan helpers.
 * Implementation under ./proof-loop/*.
 */

export {
	classifyRepiProofLoopGap,
	formatRepiProofLoopGapClassifier,
	proofSignalListFromGapText,
	repiProofLoopClassOrderFromItems,
	repiProofLoopWorkerForText,
	runtimeAdapterIdsFromGapText,
} from "./proof-loop/classify.ts";
export {
	repiProofLoopCommandTarget,
	repiProofLoopQuickPathFromItems,
	repiProofLoopQuickPlanFromItems,
	repiProofLoopRuntimeAdapterClosureRows,
	repiProofLoopRuntimeAdapterCommands,
	repiProofLoopSpecialistQueueFromItems,
} from "./proof-loop/plan.ts";
export type {
	RepiProofLoopDelegateWorker,
	RepiProofLoopGapClass,
	RepiProofLoopGapClassification,
	RepiProofLoopGapItem,
	RepiProofLoopGapSource,
	RepiProofLoopQuickPlanPhaseV1,
	RepiProofLoopQuickPlanV1,
	RepiProofLoopRuntimeAdapterClosureRowV1,
} from "./proof-loop/types.ts";
