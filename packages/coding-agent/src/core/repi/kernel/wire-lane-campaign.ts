/** Wire-lane: configureCampaignRuntime bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { writeAttackGraphArtifact } from "../attack-graph/io.ts";
import { buildAttackGraph } from "../attack-graph.ts";
import { createBootstrapPlan, updateMissionCheckpoint } from "../autopilot-deps.ts";
import { campaignEvidenceGaps, campaignPivotCandidates } from "../campaign-runtime/campaign-gaps.ts";
import { latestOrBuildCampaign } from "../campaign-runtime/campaign-write.ts";
import { operationCommandConcrete } from "../campaign-runtime/operation.ts";
import { configureCampaignRuntime } from "../campaign-runtime.ts";
import { appendEvidence } from "../evidence.ts";
import { inferTargetFromMap, latestPassiveMapContext } from "../passive-map-runtime.ts";
import { routeReconTask } from "../routes.ts";
import { recommendedToolsForRoute } from "../tool-index.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireCampaignRuntimeConfigure(pick: PickFn): void {
	configureCampaignRuntime({
		appendEvidence: pick("appendEvidence", appendEvidence),
		buildAttackGraph: pick("buildAttackGraph", buildAttackGraph),
		campaignEvidenceGaps: pick("campaignEvidenceGaps", campaignEvidenceGaps),
		campaignPivotCandidates: pick("campaignPivotCandidates", campaignPivotCandidates),
		createBootstrapPlan: pick("createBootstrapPlan", createBootstrapPlan),
		inferTargetFromMap: pick("inferTargetFromMap", inferTargetFromMap),
		latestOrBuildCampaign: pick("latestOrBuildCampaign", latestOrBuildCampaign),
		latestPassiveMapContext: pick("latestPassiveMapContext", latestPassiveMapContext),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		operationCommandConcrete: pick("operationCommandConcrete", operationCommandConcrete),
		recommendedToolsForRoute: pick("recommendedToolsForRoute", recommendedToolsForRoute),
		routeReconTask: pick("routeReconTask", routeReconTask),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		writeAttackGraphArtifact: pick("writeAttackGraphArtifact", writeAttackGraphArtifact),
	});
}
