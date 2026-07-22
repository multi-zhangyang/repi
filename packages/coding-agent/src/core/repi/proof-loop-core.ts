/**
 * Proof-loop core: gap analysis, step build/refresh, and step execution.
 * Implementation split under ./proof-loop-core/*.
 */
export type { ProofLoopCoreDeps } from "./proof-loop-core/deps.ts";
export { configureProofLoopCore, d } from "./proof-loop-core/deps.ts";
export {
	executeProofLoopBridgeStep,
	executeProofLoopQuickPathCommand,
	executeProofLoopStep,
	markProofLoopStepForCommand,
	proofLoopPhaseForCommand,
} from "./proof-loop-core/execute.ts";
export {
	proofLoopAttackGraphGapItems,
	proofLoopBridgeArtifacts,
	proofLoopCheckStatus,
	proofLoopEvidenceSummary,
	proofLoopGapClassifier,
	proofLoopGapItems,
	proofLoopQuickPath,
	proofLoopQuickPathFromGapItems,
	proofLoopQuickPlanRows,
	proofLoopRuntimeAdapterClosure,
	proofLoopSourceArtifacts,
	proofLoopSpecialistQueue,
	proofLoopSwarmBridge,
	proofLoopSwarmBridgeFromItems,
	proofLoopSwarmRetryQueue,
	proofLoopTargetRuntimeAdapterCommands,
	proofLoopVerdict,
} from "./proof-loop-core/gaps.ts";
export {
	appendProofLoopMemoryEvent,
	appendRuntimeFailureRepairFromProofLoop,
	caseMemoryProofBridge,
	compactResumeProofQueue,
	operatorFeedbackProofLoopCommands,
	proofLoopMemoryOutcome,
} from "./proof-loop-core/memory.ts";
export {
	buildProofLoopSteps,
	proofLoopNextActions,
	refreshProofLoop,
} from "./proof-loop-core/steps.ts";
