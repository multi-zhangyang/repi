/** Knowledge-scope isolation types (memory product removed; isolation still used). */
import type { RepiMemoryScope, RepiScopeVerdict } from "./artifact-scope.ts";

export type KnowledgeScopeSource = {
	kind: string;
	path: string;
	text: string;
};
export type KnowledgeScopeIsolationSourceV1 = {
	path: string;
	kind: string;
	eventId?: string;
	caseSignature?: string;
	verdict: RepiScopeVerdict;
	reasons: string[];
	blocksKnowledgeReuse: boolean;
};
export type KnowledgeScopeIsolationV1 = {
	kind: "repi-knowledge-scope-isolation";
	schemaVersion: 1;
	MemoryScopeIsolationV1: true;
	scope_filter_by_mission_session_workspace_target: true;
	reportPath: string;
	currentScope: RepiMemoryScope;
	checkedSourceCount: number;
	blockedSourceCount: number;
	warnSourceCount: number;
	allowedSourceCount: number;
	blockedEventIds: string[];
	warnEventIds: string[];
	allowedEventIds: string[];
	quarantinedSourceArtifacts: string[];
	warnSourceArtifacts: string[];
	allowedSourceArtifacts: string[];
	sourceRows: KnowledgeScopeIsolationSourceV1[];
	requiredChecks: string[];
};
export type KnowledgeScopeIsolationBuildOptions = {
	sources: KnowledgeScopeSource[];
	events: import("./artifact-scope-types.ts").ArtifactScopeEvent[];
	memoryScopeReport: import("./memory-stubs.ts").MemoryScopeIsolationReportV1;
};
