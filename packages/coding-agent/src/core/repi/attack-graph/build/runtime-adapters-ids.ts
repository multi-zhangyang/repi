/** Runtime-adapter attack-graph identity helpers. */

import {
	runtimeAdapterMitigationEvidenceForGraph,
	runtimeAdapterParserSummaryForGraph,
} from "../../graph-artifacts.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function runtimeAdapterArtifactIds(
	ctx: AttackGraphBuildCtx,
	path: string,
	artifact: any,
): {
	artifactBase: string;
	adapterId: string;
	artifactId: string;
	commandId: string;
	parserMatchCount: number;
	parserSummary: any;
	parserSummaryId: string;
	mitigationEvidence: any;
	mitigationId: string;
	targetProfile: any;
	targetProfileId: string;
} {
	const lineage = ctx.runtimeArtifactLineage.find((item: any) => item.path === path);
	const artifactBase = lineage?.artifactBase ?? ctx.artifactBasename(path);
	const adapterId = `tool:runtime-adapter:${ctx.slug(artifact.adapterId)}`;
	const artifactId =
		lineage?.artifactId ?? `artifact:runtime-adapter:${ctx.slug(artifact.adapterId)}:${ctx.slug(artifactBase)}`;
	const commandId =
		lineage?.commandId ?? `command:runtime-adapter:${ctx.slug(artifact.adapterId)}:${ctx.slug(artifactBase)}`;
	const parserMatchCount = artifact.parserSignals.reduce((sum: number, signal: any) => sum + signal.matches.length, 0);
	const parserSummary = runtimeAdapterParserSummaryForGraph(artifact);
	const parserSummaryId = `summary:runtime-adapter:${ctx.slug(artifact.adapterId)}:${ctx.slug(artifactBase)}`;
	const mitigationEvidence = runtimeAdapterMitigationEvidenceForGraph(artifact);
	const mitigationId = `artifact:binary-mitigation-map:${ctx.slug(artifact.adapterId)}:${ctx.slug(artifactBase)}`;
	const targetProfile = artifact.targetProfile;
	const targetProfileId = `target:runtime-adapter:${ctx.slug(artifact.adapterId)}:${ctx.slug(artifactBase)}`;
	return {
		artifactBase,
		adapterId,
		artifactId,
		commandId,
		parserMatchCount,
		parserSummary,
		parserSummaryId,
		mitigationEvidence,
		mitigationId,
		targetProfile,
		targetProfileId,
	};
}
