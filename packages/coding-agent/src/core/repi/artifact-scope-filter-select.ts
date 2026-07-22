/** Scoped markdown artifact selection helpers. */

import { artifactScopeDecisionMap, knowledgeScopePathKey } from "./artifact-scope-pure.ts";
import type { ScopedMarkdownArtifactSelectionOptions } from "./artifact-scope-types.ts";

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

export function latestScopedMarkdownArtifact(
	options: Omit<ScopedMarkdownArtifactSelectionOptions, "limit">,
): string | undefined {
	return scopedMarkdownArtifacts({ ...options, limit: 1 })[0];
}
