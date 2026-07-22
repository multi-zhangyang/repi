/** JS signing reverse types. */
export type JsSigningExecution = {
	label: string;
	command: string;
	status: "passed" | "failed" | "blocked";
	exit?: number | null;
	killed?: boolean;
	stdoutHash?: string;
	stderrHash?: string;
	stdoutHead?: string;
	stderrHead?: string;
};

export type JsSigningArtifact = {
	timestamp: string;
	mode: "plan" | "run";
	missionId?: string;
	route?: string;
	target?: string;
	url?: string;
	timeoutMs: number;
	executions: JsSigningExecution[];
	runtimeAnchors: string[];
	structuredSummary: string[];
	nextActions: string[];
	captureScript: string;
};
