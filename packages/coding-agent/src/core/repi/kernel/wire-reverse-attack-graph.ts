/** Wire-reverse: configureAttackGraph bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { configureAttackGraph } from "../attack-graph.ts";
import { createBootstrapPlan, updateMissionCheckpoint } from "../autopilot-deps.ts";
import { appendEvidence } from "../evidence.ts";
import { activeLane } from "../mission/lane-helpers.ts";
import { inferTargetFromMap } from "../passive-map-runtime.ts";
import { recommendedToolsForRoute } from "../tool-index.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireAttackGraphConfigure(pick: PickFn): void {
	configureAttackGraph({
		appendEvidence: pick("appendEvidence", appendEvidence),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		activeLane: pick("activeLane", activeLane),
		inferTargetFromMap: pick("inferTargetFromMap", inferTargetFromMap),
		recommendedToolsForRoute: pick("recommendedToolsForRoute", recommendedToolsForRoute),
		createBootstrapPlan: pick("createBootstrapPlan", createBootstrapPlan),
	});
}
