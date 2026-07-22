/** Campaign plan/build helpers. */

import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { buildCampaignPhases } from "../campaign-phases.ts";
import { ensureReconStorage } from "../resources.ts";
import {
	evidenceCampaignsDir,
	evidenceGraphsDir,
	evidenceRunsDir,
	readTextFile as readText,
	recentMarkdownArtifacts,
} from "../storage.ts";
import { campaignEvidenceGaps, campaignPivotCandidates } from "./campaign-gaps.ts";
import {
	buildAttackGraph,
	createBootstrapPlan,
	createMission,
	inferTargetFromMap,
	latestPassiveMapContext,
	latestScopedMarkdownArtifact,
	readCurrentMission,
	recommendedToolsForRoute,
	routeReconTask,
	writeAttackGraphArtifact,
	writeCurrentMission,
} from "./deps.ts";
import type { CampaignArtifact } from "./types.ts";

export function latestCampaignArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("campaign", evidenceCampaignsDir(), options);
}

export function parseCampaignArtifact(path: string): CampaignArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as CampaignArtifact;
	} catch {
		return undefined;
	}
}

export function buildCampaign(options: { target?: string; task?: string } = {}): CampaignArtifact {
	ensureReconStorage();
	let mission = readCurrentMission?.();
	if (!mission && options.task?.trim()) {
		mission = writeCurrentMission?.(createMission?.(options.task.trim(), routeReconTask(options.task.trim())));
	}
	const map = latestPassiveMapContext();
	const target = options.target?.trim() || (mission ? inferTargetFromMap(map, mission) : undefined) || map?.target;
	const graph = buildAttackGraph();
	const graphWriteResult = writeAttackGraphArtifact(graph);
	const [graphPath] = String(graphWriteResult ?? "").split(/\r?\n/, 1);
	mission = readCurrentMission?.() ?? mission;
	const recommended = mission ? recommendedToolsForRoute(mission.route).slice(0, 24) : ["rg", "python3", "curl"];
	const missing = recommended
		.map((tool: string) => createBootstrapPlan([tool])[0])
		.filter((item: any) => Boolean(item) && item.known && !item.present)
		.map((item: any) => item.tool);
	const sourceArtifacts = Array.from(
		new Set(
			[
				map?.path,
				graphPath,
				...recentMarkdownArtifacts(evidenceRunsDir(), 8),
				...recentMarkdownArtifacts(evidenceGraphsDir(), 2),
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 24);
	const phases = buildCampaignPhases(mission, map, target, missing, sourceArtifacts);
	const pivots = campaignPivotCandidates(mission, phases, map);
	const gaps = campaignEvidenceGaps(mission, map, graph, phases);
	const targetRef = target ?? "<target>";
	const nextActions = Array.from(
		new Set(
			[
				!map ? `re_map ${targetRef} 3` : undefined,
				"re_graph build",
				...phases.flatMap((phase: any) => phase.nextActions).slice(0, 10),
				missing.length ? `re_bootstrap plan ${missing.slice(0, 10).join(" ")}` : undefined,
				"re_complete audit",
				...gaps.filter((g: string) => g.startsWith("next: ")).map((g: string) => g.slice(6)),
			].filter((item): item is string => Boolean(item)),
		),
	).slice(0, 16);
	return {
		timestamp: new Date().toISOString(),
		missionId: mission?.id,
		route: mission?.route?.domain,
		target,
		phases,
		pivots,
		gaps,
		toolGaps: Array.from(new Set(missing)).slice(0, 16) as string[],
		nextActions,
		nextBootstrapCommand: missing.length ? `re_bootstrap plan ${missing.slice(0, 12).join(" ")}` : "none",
		sourceArtifacts,
	};
}
