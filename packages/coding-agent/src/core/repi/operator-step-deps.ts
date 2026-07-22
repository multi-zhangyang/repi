/**
 * Operator step DI deps and shared types.
 */
export type OperatorStepStatus = "pending" | "done" | "blocked" | "running" | string;

export type OperatorStep = {
	id: string;
	command: string;
	status: OperatorStepStatus;
	priority?: number;
	reason?: string;
	sourceArtifacts?: string[];
};

export type OperationExecution = {
	stepId: string;
	command: string;
	status: OperatorStepStatus;
	output: string;
};

export type OperatorStepDeps = {
	buildAutofixOutput: (...args: any[]) => any;
	buildCompilerOutput: (...args: any[]) => any;
	buildContextOutput: (...args: any[]) => any;
	buildDelegateOutput: (...args: any[]) => any;
	buildExploitLabOutput: (...args: any[]) => any;
	buildKernelOutput: (...args: any[]) => any;
	buildKnowledgeGraphOutput: (...args: any[]) => any;
	buildMissionDigest: (...args: any[]) => any;
	buildMobileRuntimeOutput: (...args: any[]) => any;
	buildNativeRuntimeOutput: (...args: any[]) => any;
	buildOperationOutput: (...args: any[]) => any;
	buildOperatorOutput: (...args: any[]) => any;
	buildProofLoopOutput: (...args: any[]) => any;
	buildReflectOutput: (...args: any[]) => any;
	buildReplayerOutput: (...args: any[]) => any;
	buildSupervisorOutput: (...args: any[]) => any;
	buildSwarmOutput: (...args: any[]) => any;
	buildVerifierOutput: (...args: any[]) => any;
	buildWebAuthzStateOutput: (...args: any[]) => any;
	createMission: (...args: any[]) => any;
	dispatchOperatorQueue: (...args: any[]) => any;
	executeOperationStep: (...args: any[]) => any;
	formatMission: (...args: any[]) => any;
	formatPlaybookMaintenance: (...args: any[]) => any;
	maintainPlaybooks: (...args: any[]) => any;
	operationStepFromOperator: (...args: any[]) => any;
	routeReconTask: (...args: any[]) => any;
	runAutopilot: (...args: any[]) => any;
	runExploitLab: (...args: any[]) => any;
	runMobileRuntime: (...args: any[]) => any;
	runNativeRuntime: (...args: any[]) => any;
	runOperationQueue: (...args: any[]) => any;
	runProofLoop: (...args: any[]) => any;
	runReplayer: (...args: any[]) => any;
	runSwarm: (...args: any[]) => any;
	runWebAuthzState: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	writeCurrentMission: (...args: any[]) => any;
};

let operatorStepDeps: OperatorStepDeps | null = null;

export function configureOperatorStep(deps: OperatorStepDeps): void {
	operatorStepDeps = deps;
}

export function d(): OperatorStepDeps {
	if (!operatorStepDeps) {
		throw new Error("operator-step not configured; call configureOperatorStep() from REPI kernel init");
	}
	return operatorStepDeps;
}
