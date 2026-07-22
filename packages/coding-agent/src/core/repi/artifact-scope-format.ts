/** Artifact scope formatters and selection cache. */
import type { ArtifactScopeFilterReportV1 } from "./artifact-scope-types.ts";

export function formatArtifactScopeFilter(report: ArtifactScopeFilterReportV1): string {
	return [
		"artifact_scope_filter:",
		`ArtifactScopeFilterV1=${report.ArtifactScopeFilterV1}`,
		`MemoryScopeIsolationV1=${report.MemoryScopeIsolationV1}`,
		`latest_artifact_side_channel_scope_filter=${report.latest_artifact_side_channel_scope_filter}`,
		`requested_by=${report.requestedBy}`,
		`current_target=${report.currentScope.target ?? "none"}`,
		`checked=${report.checkedArtifactCount}`,
		`allowed=${report.allowedArtifactCount}`,
		`warned=${report.warnArtifactCount}`,
		`blocked=${report.blockedArtifactCount}`,
		"decisions:",
		...(report.decisions.length
			? report.decisions
					.slice(0, 40)
					.map(
						(row: any) =>
							`- verdict=${row.verdict} matched_by=${row.matchedBy} action=${row.recommendedAction} path=${row.path} reasons=${row.reasons.join(",") || "none"}`,
					)
			: ["- none"]),
		"quarantined:",
		...(report.quarantinedArtifacts.length
			? report.quarantinedArtifacts.slice(0, 24).map((path: any) => `- ${path}`)
			: ["- none"]),
		"required_checks:",
		...report.requiredChecks.map((checkpoint: any) => `- ${checkpoint}`),
	].join("\n");
}

let scopedMarkdownArtifactSelectionCache: Map<string, string[]> | undefined;

export function getScopedMarkdownArtifactSelectionCache(): Map<string, string[]> | undefined {
	return scopedMarkdownArtifactSelectionCache;
}

export function withScopedMarkdownArtifactSelectionCache<T>(fn: () => T): T {
	if (scopedMarkdownArtifactSelectionCache) return fn();
	const cache = new Map<string, string[]>();
	scopedMarkdownArtifactSelectionCache = cache;
	try {
		return fn();
	} finally {
		scopedMarkdownArtifactSelectionCache = undefined;
	}
}
