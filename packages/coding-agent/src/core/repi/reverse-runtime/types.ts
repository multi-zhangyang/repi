/** Reverse-runtime artifact/execution types. */
export type ExploitLabExecution = {
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

export type ExploitLabArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "run" | "bundle";
	runs: number;
	timeoutMs: number;
	labMatrix: string[];
	pocInventory: string[];
	environmentPins: string[];
	replayMatrix: string[];
	flakeTriage: string[];
	bundleManifest: string[];
	labCommands: string[];
	executions: ExploitLabExecution[];
	stabilityAnchors: string[];
	/** Compact evidence fields (summary.* / technique bridges). */
	structuredSummary: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};

export type MobileRuntimeExecution = {
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

export type MobileRuntimeArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	packageName?: string;
	mode: "plan" | "run";
	timeoutMs: number;
	captureScript: string;
	deviceMatrix: string[];
	apkInventory: string[];
	processMap: string[];
	hookPlan: string[];
	fridaHooks: string[];
	nativeTrace: string[];
	antiDebugChecks: string[];
	replayCommands: string[];
	executions: MobileRuntimeExecution[];
	runtimeAnchors: string[];
	/** Compact evidence fields (summary.* / technique bridges). */
	structuredSummary: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};

export type NativeRuntimeExecution = {
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

export type NativeRuntimeArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "run";
	timeoutMs: number;
	captureScript: string;
	binaryInventory: string[];
	mitigationMatrix: string[];
	loaderLibc: string[];
	symbolMap: string[];
	crashPlan: string[];
	gdbTrace: string[];
	breakpointPlan: string[];
	exploitScaffold: string[];
	replayCommands: string[];
	executions: NativeRuntimeExecution[];
	runtimeAnchors: string[];
	/** Compact evidence fields (summary.* / technique bridges). */
	structuredSummary: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};
