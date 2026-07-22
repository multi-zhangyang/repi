/** Web-runtime types. */
export type LiveBrowserExecution = {
	label: string;
	command: string;
	status: "planned" | "passed" | "failed" | "blocked";
	exit?: number;
	killed?: boolean;
	stdoutHash?: string;
	stderrHash?: string;
	stdoutHead?: string;
	stderrHead?: string;
};

export type LiveBrowserArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "run";
	url?: string;
	timeoutMs: number;
	captureScript: string;
	runtimeMatrix: string[];
	authMatrix: string[];
	idorBolaProbes: string[];
	websocketProbes: string[];
	replayCommands: string[];
	executions: LiveBrowserExecution[];
	runtimeAnchors: string[];
	nextActions: string[];
	sourceArtifacts: string[];

	structuredSummary?: string[];
};

export type WebAuthzStateExecution = {
	label: string;
	command: string;
	status: "planned" | "passed" | "failed" | "blocked";
	exit?: number;
	killed?: boolean;
	stdoutHash?: string;
	stderrHash?: string;
	stdoutHead?: string;
	stderrHead?: string;
};

export type WebAuthzStateArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "run";
	url?: string;
	timeoutMs: number;
	captureScript: string;
	routeInventory: string[];
	principalMatrix: string[];
	objectProbes: string[];
	stateMachine: string[];
	sequenceReplay: string[];
	ownershipChecks: string[];
	rollbackChecks: string[];
	replayCommands: string[];
	executions: WebAuthzStateExecution[];
	runtimeAnchors: string[];
	nextActions: string[];
	sourceArtifacts: string[];

	structuredSummary?: string[];
};
