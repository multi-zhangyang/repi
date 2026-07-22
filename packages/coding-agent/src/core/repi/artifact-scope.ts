/** Artifact scope filter and scoped markdown selection. */

export {
	artifactScopeDefaultOptions,
	buildArtifactScopeFilterReport,
	latestScopedMarkdownArtifact,
	scopedMarkdownArtifacts,
} from "./artifact-scope-filter.ts";
export {
	artifactExplicitTarget,
	artifactScopeDecisionMap,
	artifactScopeInferTarget,
	artifactScopeMatchForSource,
	artifactScopeVerdictPriority,
	artifactTargetMatches,
	formatArtifactScopeFilter,
	getScopedMarkdownArtifactSelectionCache,
	knowledgeScopePathKey,
	withScopedMarkdownArtifactSelectionCache,
} from "./artifact-scope-pure.ts";
export type {
	ArtifactScopeArtifact,
	ArtifactScopeEvent,
	ArtifactScopeFilterDecisionV1,
	ArtifactScopeFilterOptions,
	ArtifactScopeFilterReportV1,
	ArtifactScopeMemoryReport,
	ArtifactScopeMemoryRow,
	ArtifactScopeReportBuildOptions,
	RepiMemoryScope,
	RepiScopeVerdict,
	ScopedMarkdownArtifactSelectionOptions,
} from "./artifact-scope-types.ts";
