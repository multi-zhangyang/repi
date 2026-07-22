/**
 * Operation step DI deps and shared types.
 */
export type OperationStepStatus = "ready" | "done" | "blocked" | "pending" | "running" | string;

export type OperationStep = {
	id: string;
	phase?: string;
	command: string;
	status?: OperationStepStatus;
	priority?: number;
	reason?: string;
	sourceArtifacts?: string[];
};

export type OperationStepDeps = {
	runDecisionCore: (...args: any[]) => any;
	buildDecisionCoreOutput: (...args: any[]) => any;
	runAutoLaneChain: (...args: any[]) => any;
	readCurrentMission: (...args: any[]) => any;
	writeCurrentMission: (...args: any[]) => any;
	createMission: (...args: any[]) => any;
	routeReconTask: (...args: any[]) => any;
	activeLane: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	laneCommandPack: (...args: any[]) => any;
	formatLaneCommandPack: (...args: any[]) => any;
	runLaneCommandPack: (...args: any[]) => any;
	runPassiveMap: (...args: any[]) => any;
	buildKernelOutput: (...args: any[]) => any;
	runLiveBrowser: (...args: any[]) => any;
	buildLiveBrowserOutput: (...args: any[]) => any;
	runWebAuthzState: (...args: any[]) => any;
	buildWebAuthzStateOutput: (...args: any[]) => any;
	runJsSigning: (...args: any[]) => any;
	buildJsSigningOutput: (...args: any[]) => any;
	runMobileRuntime: (...args: any[]) => any;
	buildMobileRuntimeOutput: (...args: any[]) => any;
	runNativeRuntime: (...args: any[]) => any;
	buildNativeRuntimeOutput: (...args: any[]) => any;
	runExploitLab: (...args: any[]) => any;
	buildExploitLabOutput: (...args: any[]) => any;
	buildAttackGraphOutput: (...args: any[]) => any;
	buildExploitChainOutput: (...args: any[]) => any;
	buildCampaignOutput: (...args: any[]) => any;
	runReplayer: (...args: any[]) => any;
	buildReplayerOutput: (...args: any[]) => any;
	buildAutofixOutput: (...args: any[]) => any;
	runProofLoop: (...args: any[]) => any;
	buildProofLoopOutput: (...args: any[]) => any;
	buildKnowledgeGraphOutput: (...args: any[]) => any;
	buildVerifierOutput: (...args: any[]) => any;
	buildCompilerOutput: (...args: any[]) => any;
	createBootstrapPlan: (...args: any[]) => any;
	formatBootstrapPlan: (...args: any[]) => any;
	formatCompletionAudit: (...args: any[]) => any;
	writeReportScaffold: (...args: any[]) => any;
	refreshToolIndex: (...args: any[]) => any;
	runRuntimeAdapterExecution: (...args: any[]) => any;
	buildDomainProofExitClosure: (...args: any[]) => any;
	writeDomainProofExitClosureArtifact: (...args: any[]) => any;
	formatDomainProofExitClosure: (...args: any[]) => any;
	formatCompletionAuditFromAudit?: (...args: any[]) => any;
	auditCompletion?: (...args: any[]) => any;
	softFillOptionalOrchestrationWhenReverseReady?: (...args: any[]) => any;
};

let operationStepDeps: OperationStepDeps | null = null;

export function configureOperationStep(deps: OperationStepDeps): void {
	operationStepDeps = deps;
}

export function d(): OperationStepDeps {
	if (!operationStepDeps)
		throw new Error("operation-step not configured; call configureOperationStep() from REPI kernel init");
	return operationStepDeps;
}
