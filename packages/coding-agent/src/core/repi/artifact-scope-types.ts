/** Artifact scope filter types. */

export type RepiScopeVerdict = "allow" | "warn" | "block";
export type RepiMemoryScope = {
	missionId?: string;
	sessionId?: string;
	workspaceId?: string;
	target?: string;
	[key: string]: unknown;
};

export type ArtifactScopeFilterDecisionV1 = {
	kind: "repi-artifact-scope-filter-decision";
	schemaVersion: 1;
	path: string;
	artifactKind: string;
	requestedBy: string;
	eventId?: string;
	caseSignature?: string;
	verdict: RepiScopeVerdict;
	reasons: string[];
	blocksArtifactReuse: boolean;
	recommendedAction: "allow" | "retain" | "quarantine" | "manual-review";
	matchedBy: "artifact-hash" | "text-reference" | "untracked";
};

export type ArtifactScopeFilterReportV1 = {
	kind: "repi-artifact-scope-filter-report";
	schemaVersion: 1;
	generatedAt: string;
	ArtifactScopeFilterV1: true;
	MemoryScopeIsolationV1: true;
	latest_artifact_side_channel_scope_filter: true;
	reportPath: string;
	requestedBy: string;
	currentScope: RepiMemoryScope;
	checkedArtifactCount: number;
	blockedArtifactCount: number;
	warnArtifactCount: number;
	allowedArtifactCount: number;
	quarantinedArtifacts: string[];
	warnArtifacts: string[];
	allowedArtifacts: string[];
	decisions: ArtifactScopeFilterDecisionV1[];
	requiredChecks: string[];
};

export type ArtifactScopeFilterOptions = {
	route?: string;
	target?: string;
	requestedBy?: string;
	scanLimit?: number;
	write?: boolean;
};

export type ArtifactScopeArtifact = {
	kind: string;
	path: string;
	text?: string;
};

export type ArtifactScopeEvent = {
	id: string;
	artifactHashes: Array<{ path: string }>;
};

export type ArtifactScopeMemoryRow = {
	eventId: string;
	caseSignature: string;
	verdict: RepiScopeVerdict;
	reasons: string[];
	eventScope?: {
		target?: string;
	};
};

export type ArtifactScopeMemoryReport<T extends ArtifactScopeMemoryRow = ArtifactScopeMemoryRow> = {
	currentScope: RepiMemoryScope;
	rows: T[];
};

export type ArtifactScopeReportBuildOptions<T extends ArtifactScopeMemoryRow = ArtifactScopeMemoryRow> = {
	target?: string;
	requestedBy: string;
	reportPath: string;
	artifacts: ArtifactScopeArtifact[];
	events: ArtifactScopeEvent[];
	memoryReport: ArtifactScopeMemoryReport<T>;
	memoryTargetScope: (target: string) => string;
	sanitizeTarget?: (target: string) => string | undefined;
	readText?: (path: string) => string;
	generatedAt?: string;
};

export type ScopedMarkdownArtifactSelectionOptions = {
	kind: string;
	limit: number;
	candidatePaths: string[];
	readText: (path: string) => string;
	truncateText: (text: string, limit: number) => string;
	buildReport: (artifacts: ArtifactScopeArtifact[]) => ArtifactScopeFilterReportV1;
};
