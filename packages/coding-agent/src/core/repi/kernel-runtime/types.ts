/** Kernel-runtime types. */
export type KernelDirective = {
	id: string;
	layer: "system" | "skill" | "tooling" | "mission" | "memory" | "evidence" | "operator";
	directive: string;
	evidence: string[];
	priority: number;
};

export type KernelArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "build" | "audit";
	directives: KernelDirective[];
	directiveStack: string[];
	executionInvariants: string[];
	operatorCommandFloor: string[];
	specialistCapabilityMatrix: string[];
	proofExitCriteria: string[];
	refusalToExecutionRules: string[];
	domainCapabilities: string[];
	toolCallPolicy: string[];
	artifactContract: string[];
	stallRecovery: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};

export type KernelRuntimeDeps = {
	appendEvidence: (...args: any[]) => any;
	commandTarget: (...args: any[]) => any;
	latestAutofixArtifactPath: (...args: any[]) => any;
	latestCompilerArtifactPath: (...args: any[]) => any;
	latestContextPackArtifactPath: (...args: any[]) => any;
	latestDecisionCoreArtifactPath: (...args: any[]) => any;
	latestExploitChainArtifactPath: (...args: any[]) => any;
	latestExploitLabArtifactPath: (...args: any[]) => any;
	latestKnowledgeGraphArtifactPath: (...args: any[]) => any;
	latestMobileRuntimeArtifactPath: (...args: any[]) => any;
	latestNativeRuntimeArtifactPath: (...args: any[]) => any;
	latestOperatorArtifactPath: (...args: any[]) => any;
	latestProofLoopArtifactPath: (...args: any[]) => any;
	latestReplayerArtifactPath: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	latestVerifierArtifactPath: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
};
