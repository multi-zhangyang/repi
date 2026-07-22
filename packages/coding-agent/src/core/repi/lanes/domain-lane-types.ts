/** Domain lane command types. */
export type DomainLaneCommand = {
	label: string;
	command: string;
	evidence: string;
};

/** Caller-facing context (domain string + lane + target). */
export type DomainLaneCommandContext = {
	domain: string;
	laneName: string;
	effectiveTarget?: string;
	commands: DomainLaneCommand[];
	notes: string[];
};

/** Internal expanded context after target/route classification. */
export type DomainLaneRuntimeCtx = DomainLaneCommandContext & {
	laneName: string;
	isNativeRoute: boolean;
	isAndroidRoute: boolean;
	isPwnRoute: boolean;
	isWebRoute: boolean;
	isJsRoute: boolean;
	targetIsDirectory: boolean;
	targetArg: string;
	targetPython: string;
	urlArg: string;
	add: (label: string, command: string, evidence: string) => void;
};
