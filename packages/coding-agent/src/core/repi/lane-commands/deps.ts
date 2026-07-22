/**
 * Lane-commands DI deps and passthrough stubs.
 */

import type { MissionLane, MissionState } from "../mission/types.ts";
import type { PassiveMapContext } from "../passive-map-runtime.ts";
import type { LaneCommandDeps } from "./types.ts";

export type { LaneCommandDeps } from "./types.ts";

let laneCommandDeps: LaneCommandDeps | null = null;

export function configureLaneCommands(deps: LaneCommandDeps): void {
	laneCommandDeps = deps;
}

export function deps(): LaneCommandDeps {
	if (!laneCommandDeps) {
		throw new Error("lane-commands not configured; call configureLaneCommands() from REPI kernel init");
	}
	return laneCommandDeps;
}

export function latestPassiveMapContext(): PassiveMapContext | undefined {
	return deps().latestPassiveMapContext();
}

export function inferTargetFromMap(map: PassiveMapContext, mission: MissionState): string | undefined {
	return deps().inferTargetFromMap(map, mission);
}

export function memoryCommandCandidates(mission: MissionState, lane: MissionLane, target?: string) {
	return deps().memoryCommandCandidates(mission, lane, target);
}

export function laneExecutionStrategy(...args: any[]): any {
	return deps().laneExecutionStrategy(...args);
}

export function formatAutopilotExecutionStrategy(...args: any[]): any {
	return deps().formatAutopilotExecutionStrategy(...args);
}

export function analyzeLaneRun(...args: any[]): any {
	return deps().analyzeLaneRun(...args);
}

export function formatLaneRunAnalysis(...args: any[]): any {
	return deps().formatLaneRunAnalysis(...args);
}

export function appendEvidence(...args: any[]): any {
	return deps().appendEvidence(...args);
}

export function appendLaneRunMemoryEvent(...args: any[]): any {
	return deps().appendLaneRunMemoryEvent(...args);
}

export function appendMemoryReuseFeedback(...args: any[]): any {
	return deps().appendMemoryReuseFeedback(...args);
}

export function applyLaneRunMissionUpdate(...args: any[]): any {
	return deps().applyLaneRunMissionUpdate(...args);
}
