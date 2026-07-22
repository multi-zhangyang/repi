/** Wire-swarm: configureReflection bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { appendEvidence } from "../evidence.ts";
import { writeReflectionMemory } from "../memory-stubs.ts";
import {
	buildWorkerPromotionQueue,
	configureReflection,
	latestOrBuildSupervisor,
	workerAdaptiveRoutingHints,
} from "../reflection/types-config.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireReflectionConfigure(pick: PickFn): void {
	configureReflection({
		appendEvidence: pick("appendEvidence", appendEvidence),
		buildWorkerPromotionQueue: pick("buildWorkerPromotionQueue", buildWorkerPromotionQueue),
		latestOrBuildSupervisor: pick("latestOrBuildSupervisor", latestOrBuildSupervisor),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		workerAdaptiveRoutingHints: pick("workerAdaptiveRoutingHints", workerAdaptiveRoutingHints),
		writeReflectionMemory: pick("writeReflectionMemory", writeReflectionMemory),
	});
}
