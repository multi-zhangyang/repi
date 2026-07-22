/** Lane command pack domain types. */
export type LaneDomainPackCtx = {
	laneName: string;
	isNativeRoute: boolean;
	isAndroidRoute: boolean;
	isPwnRoute: boolean;
	isWebRoute: boolean;
	isJsRoute: boolean;
	targetIsDirectory: boolean;
	effectiveTarget?: string;
	targetArg: string;
	targetPython: string;
	urlArg: string;
	add: (label: string, command: string, evidence: string) => void;
	notes: string[];
};
