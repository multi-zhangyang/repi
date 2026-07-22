/** Proof-loop core DI deps and passthrough stubs. */

export {
	buildAttackGraphOutput,
	buildCompilerOutput,
	buildDelegateOutput,
	buildKnowledgeGraphOutput,
	buildOperatorOutput,
	buildSwarmOutput,
	buildVerifierOutput,
	delegateEvidenceContract,
	failureSignaturePriorityReport,
} from "./deps-build.ts";
export type { ProofLoopCoreDeps } from "./deps-core.ts";
export { configureProofLoopCore, d } from "./deps-core.ts";
export {
	latestAttackGraphArtifactPath,
	latestCompilerArtifactPath,
	latestDecisionCoreArtifactPath,
	latestDelegateArtifactPath,
	latestKnowledgeGraphArtifactPath,
	latestOperatorArtifactPath,
	latestOperatorFeedback,
	latestReconCompactionResumeTelemetry,
	latestReplayerArtifactPath,
	latestSwarmArtifactPath,
	latestSwarmRetryQueue,
	latestVerifierArtifactPath,
} from "./deps-latest.ts";
export {
	parseAttackGraphArtifact,
	parseAutofixArtifact,
	parseCompilerArtifact,
	parseReplayArtifact,
	parseVerifierArtifact,
} from "./deps-parse.ts";
export {
	appendMemoryEvent,
	appendRuntimeFailureInputs,
	artifactTargetMatches,
	autonomousExecutionBudget,
	operatorCommandConcrete,
	operatorFeedbackDispatcherCommands,
	operatorStepPriority,
	runAutopilot,
	runReplayer,
	runtimeAdapterMitigationEvidenceForGraph,
	runtimeAdapterParserSummaryForGraph,
	runtimeFailureCategory,
	runtimeFailureCommandTarget,
} from "./deps-run.ts";
