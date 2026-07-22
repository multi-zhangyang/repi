/** Context-pack index/resume types. */
export type ContextArtifactIndexEntry = {
	kind: string;
	path: string;
	artifactId?: string;
	exists?: boolean;
	required?: boolean;
	size?: number;
	mtime?: string;
	sha256?: string | null;
	evidenceRank?: string;
	sourceCommand?: string;
	scopeVerdict?: any;
	scopeReasons?: string[];
	scopeEventId?: string;
	scopeFilterReportPath?: string;
};

export type ContextResumeVerification = {
	ref?: string;
	sourcePath?: string;
	loadedBy: "contextPath" | "compactionEntryId" | "latest" | "missing";
	contextSha256: "pass" | "missing" | "drift";
	artifactHashes: "pass" | "missing" | "drift";
	scope: "pass" | "missing" | "mismatch";
	blocked: string[];
	warnings: string[];
};
