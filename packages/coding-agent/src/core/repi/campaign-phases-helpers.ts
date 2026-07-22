/** Campaign phase pure helpers. */
/**
 * Campaign phase planning from mission/map/tool gaps.
 */

import type { MissionState } from "./mission.ts";

export function textHasAny(text: string, patterns: RegExp[]): boolean {
	return patterns.some((pattern: any) => pattern.test(text));
}

export function matchingLaneNames(mission: MissionState | undefined, patterns: RegExp[]): string[] {
	if (!mission) return [];
	return mission.lanes
		.filter((lane: any) =>
			patterns.some((pattern: any) => pattern.test(`${lane.name}\n${lane.objective}\n${lane.next.join("\n")}`)),
		)
		.map((lane: any) => lane.name);
}

export function phaseDoneFromLanes(mission: MissionState | undefined, lanes: string[]): boolean {
	if (!mission || lanes.length === 0) return false;
	return lanes.every((name: any) => mission.lanes.find((lane: any) => lane.name === name)?.status === "done");
}
