/** Runtime types: verifier-replay. */

export type VerifierStatus = "proved" | "weak" | "contradicted" | "missing";

export type VerifierAssertion = {
	id: string;
	subject: string;
	claim: string;
	status: VerifierStatus;
	confidence: number;
	evidence: string[];
	counterEvidence: string[];
	requiredFollowups: string[];
};

export type ReplayStatus = "ready" | "passed" | "failed" | "blocked" | "skipped";

export type ReplayStep = {
	id: string;
	command: string;
	status: ReplayStatus;
	reason?: string;
	sourceArtifacts: string[];
};

export type ReplayExecution = {
	stepId: string;
	command: string;
	status: ReplayStatus;
	exit: number;
	killed?: boolean;
	stdoutHash: string;
	stderrHash: string;
	stdoutHead: string;
	stderrHead: string;
};

export type ReplayArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "run";
	compilerArtifact?: string;
	operatorFeedback: string[];
	steps: ReplayStep[];
	executions: ReplayExecution[];
	replayMatrix: string[];
	passed: number;
	failed: number;
	blocked: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};
