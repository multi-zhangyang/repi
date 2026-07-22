/** Scoped markdown artifact selection helpers. */

import { buildArtifactScopeFilterReport } from "./artifact-scope-filter-report.ts";
import { artifactScopeDecisionMap, artifactScopeInferTarget, knowledgeScopePathKey } from "./artifact-scope-pure.ts";
import type {
	ArtifactScopeArtifact,
	ArtifactScopeFilterOptions,
	ScopedMarkdownArtifactSelectionOptions,
} from "./artifact-scope-types.ts";
import { readCurrentMission } from "./mission.ts";
import { readTextFile as readText, recentMarkdownArtifacts } from "./storage.ts";
import { sanitizeTargetForCommand } from "./target.ts";
import { truncateMiddle } from "./text.ts";

export function scopedMarkdownArtifacts(options: ScopedMarkdownArtifactSelectionOptions): string[] {
	const artifacts = options.candidatePaths.map((path: any) => ({
		kind: options.kind,
		path,
		text: options.truncateText(options.readText(path), 7000),
	}));
	if (artifacts.length === 0) return [];
	const report = options.buildReport(artifacts);
	const decisions = artifactScopeDecisionMap(report);
	return artifacts
		.filter((artifact: any) => decisions.get(knowledgeScopePathKey(artifact.path))?.blocksArtifactReuse !== true)
		.slice(0, options.limit)
		.map((artifact: any) => artifact.path);
}

function defaultScope(options: ArtifactScopeFilterOptions = {}) {
	const mission = readCurrentMission();
	return {
		route: options.route ?? mission?.route.domain,
		target: sanitizeTargetForCommand(options.target) ?? artifactScopeInferTarget(mission?.task),
		requestedBy: options.requestedBy ?? "latest_artifact_side_channel",
		scanLimit: options.scanLimit,
		write: options.write,
	};
}

function buildDefaultScopeReport(
	kind: string,
	artifacts: ArtifactScopeArtifact[],
	options: ArtifactScopeFilterOptions = {},
) {
	const scope = defaultScope({
		...options,
		requestedBy: options.requestedBy ?? `latest_${kind}`,
	});
	// Memory product removed: empty rows → allow unless explicit target mismatch.
	return buildArtifactScopeFilterReport({
		route: scope.route,
		target: scope.target,
		requestedBy: scope.requestedBy,
		reportPath: "",
		artifacts,
		events: [],
		memoryReport: { currentScope: {}, rows: [] },
		memoryTargetScope: (target: string) => String(target),
		readText,
		sanitizeTarget: (target: string) => target,
	} as any);
}

/**
 * Dual call styles:
 * 1) object form: latestScopedMarkdownArtifact({ kind, candidatePaths, readText, truncateText, buildReport })
 * 2) product form used by latest*ArtifactPath: latestScopedMarkdownArtifact(kind, dir, options?)
 */
export function latestScopedMarkdownArtifact(
	kindOrOptions: string | Omit<ScopedMarkdownArtifactSelectionOptions, "limit">,
	dir?: string,
	options: ArtifactScopeFilterOptions = {},
): string | undefined {
	if (typeof kindOrOptions === "object" && kindOrOptions && Array.isArray((kindOrOptions as any).candidatePaths)) {
		return scopedMarkdownArtifacts({ ...(kindOrOptions as any), limit: 1 })[0];
	}
	const kind = String(kindOrOptions ?? "artifact");
	const scanLimit = Math.max(1, Math.min(32, Math.floor(options.scanLimit ?? 8)));
	const candidatePaths = recentMarkdownArtifacts(String(dir ?? ""), scanLimit);
	if (candidatePaths.length === 0) return undefined;
	try {
		const selected = scopedMarkdownArtifacts({
			kind,
			limit: 1,
			candidatePaths,
			readText,
			truncateText: truncateMiddle,
			buildReport: (artifacts) => buildDefaultScopeReport(kind, artifacts, options),
		});
		return selected[0] ?? candidatePaths[0];
	} catch {
		// Never crash reverse tool paths on scope filter failures.
		return candidatePaths[0];
	}
}
