/** Proof-loop core DI deps type + configure. */
export type ProofLoopCoreDeps = {
	appendMemoryEvent: (...args: any[]) => any;
	appendRuntimeFailureInputs: (...args: any[]) => any;
	artifactTargetMatches: (...args: any[]) => any;
	autonomousExecutionBudget: (...args: any[]) => any;
	buildAttackGraphOutput: (...args: any[]) => any;
	buildCompilerOutput: (...args: any[]) => any;
	buildDelegateOutput: (...args: any[]) => any;
	buildKnowledgeGraphOutput: (...args: any[]) => any;
	buildOperatorOutput: (...args: any[]) => any;
	buildSwarmOutput: (...args: any[]) => any;
	buildVerifierOutput: (...args: any[]) => any;
	delegateEvidenceContract: (...args: any[]) => any;
	failureSignaturePriorityReport: (...args: any[]) => any;
	latestAttackGraphArtifactPath: (...args: any[]) => any;
	latestCompilerArtifactPath: (...args: any[]) => any;
	latestDecisionCoreArtifactPath: (...args: any[]) => any;
	latestDelegateArtifactPath: (...args: any[]) => any;
	latestKnowledgeGraphArtifactPath: (...args: any[]) => any;
	latestOperatorArtifactPath: (...args: any[]) => any;
	latestOperatorFeedback: (...args: any[]) => any;
	latestReconCompactionResumeTelemetry: (...args: any[]) => any;
	latestReplayerArtifactPath: (...args: any[]) => any;
	latestSwarmArtifactPath: (...args: any[]) => any;
	latestSwarmRetryQueue: (...args: any[]) => any;
	latestVerifierArtifactPath: (...args: any[]) => any;
	operatorCommandConcrete: (...args: any[]) => any;
	operatorFeedbackDispatcherCommands: (...args: any[]) => any;
	operatorStepPriority: (...args: any[]) => any;
	parseAttackGraphArtifact: (...args: any[]) => any;
	parseAutofixArtifact: (...args: any[]) => any;
	parseCompilerArtifact: (...args: any[]) => any;
	parseReplayArtifact: (...args: any[]) => any;
	parseVerifierArtifact: (...args: any[]) => any;
	runAutopilot: (...args: any[]) => any;
	runReplayer: (...args: any[]) => any;
	runtimeAdapterMitigationEvidenceForGraph: (...args: any[]) => any;
	runtimeAdapterParserSummaryForGraph: (...args: any[]) => any;
	runtimeFailureCategory: (...args: any[]) => any;
	runtimeFailureCommandTarget: (...args: any[]) => any;
};

let proofLoopCoreDeps: ProofLoopCoreDeps | null = null;

export function configureProofLoopCore(deps: ProofLoopCoreDeps): void {
	proofLoopCoreDeps = deps;
}

export function d(): ProofLoopCoreDeps {
	if (!proofLoopCoreDeps)
		throw new Error("proof-loop-core not configured; call configureProofLoopCore() from REPI kernel init");
	return proofLoopCoreDeps;
}
