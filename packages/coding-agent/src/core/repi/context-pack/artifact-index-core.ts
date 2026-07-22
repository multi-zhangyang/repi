import type {
	ArtifactScopeFilterDecisionV1,
	ArtifactScopeFilterOptions,
	ArtifactScopeFilterReportV1,
} from "../artifact-scope.ts";
import {
	artifactScopeDecisionMap,
	artifactScopeDefaultOptions,
	buildArtifactScopeFilterReport,
	knowledgeScopePathKey,
} from "../artifact-scope.ts";
import { readTextFile as readText, recentMarkdownArtifacts } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { contextArtifactEntry } from "./artifact-helpers.ts";
import { contextArtifactDirSpecs } from "./artifact-index-specs.ts";
import { buildContextMemoryPairs } from "./memory-pairs.ts";
import type { ContextArtifactIndexEntry } from "./types.ts";

export function scopedContextArtifactIndex(options: ArtifactScopeFilterOptions = {}): {
	entries: ContextArtifactIndexEntry[];
	artifactScopeFilter: ArtifactScopeFilterReportV1;
} {
	const scope = artifactScopeDefaultOptions({
		...options,
		requestedBy: options.requestedBy ?? "context_artifact_index",
	});
	const artifactSpecs = contextArtifactDirSpecs();
	const scanLimit = scope.scanLimit ?? 8;
	const candidateSources = artifactSpecs.flatMap(([kind, dir]) =>
		recentMarkdownArtifacts(dir, scanLimit).map((path: any) => ({
			kind,
			path,
			text: truncateMiddle(readText(path), 7000),
		})),
	);
	// Memory product removed: never require memoryReport.rows; empty rows allow.
	const artifactScopeFilter = buildArtifactScopeFilterReport({
		route: scope.route,
		target: scope.target,
		requestedBy: scope.requestedBy,
		reportPath: "",
		artifacts: candidateSources,
		events: [],
		memoryReport: { currentScope: {}, rows: [] },
		memoryTargetScope: (target: string) => String(target),
		readText,
		sanitizeTarget: (target: string) => target,
		write: scope.write,
	} as any);
	const decisions = artifactScopeDecisionMap(artifactScopeFilter);
	const pairs: Array<[string, string | undefined, ArtifactScopeFilterDecisionV1 | undefined]> = artifactSpecs.map(
		([kind, dir]) => {
			const path = recentMarkdownArtifacts(dir, scanLimit).find(
				(candidate) => decisions.get(knowledgeScopePathKey(candidate))?.blocksArtifactReuse !== true,
			);
			return [kind, path, path ? decisions.get(knowledgeScopePathKey(path)) : undefined];
		},
	);
	const memoryPairs = buildContextMemoryPairs({ requestedBy: scope.requestedBy });
	const entries = [
		...pairs
			.filter((pair): pair is [string, string, ArtifactScopeFilterDecisionV1 | undefined] => Boolean(pair[1]))
			.map(([kind, path, decision]) => contextArtifactEntry(kind, path, decision)),
		...memoryPairs
			.filter((pair): pair is [string, string] => Boolean(pair[1]))
			.map(([kind, path]) => ({
				...contextArtifactEntry(kind, path),
				required: !/compact_resume_(?:transition_ledger|ledger_v2_report)/i.test(kind),
			})),
	];
	return { entries, artifactScopeFilter };
}
