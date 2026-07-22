/** Auto-lane mission/next/defaults/strategy helpers. */

import { autopilotExecutionStrategy } from "../autopilot.ts";
import type { LaneCommandPack } from "../lane-commands.ts";
import { findLaneIndex } from "../lane-run-mission/helpers.ts";
import { writeCurrentMission } from "../mission/io-read-write.ts";
import type { MissionState } from "../mission.ts";
import { envBoolean } from "../text.ts";
import { bootstrapPlanForCommandPack } from "../tool-index.ts";
import { d } from "./deps.ts";

export function removeLaneNextItems(laneName: string, rawItems: string[]): MissionState | undefined {
	if (rawItems.length === 0) return d().readCurrentMission();
	const mission = d().readCurrentMission();
	if (!mission) return undefined;
	const index = findLaneIndex(mission, laneName);
	if (index < 0) return mission;
	const remove = new Set(rawItems);
	const timestamp = new Date().toISOString();
	const lanes = mission.lanes.map((lane: any, laneIndex: any) =>
		laneIndex === index
			? { ...lane, next: lane.next.filter((item: any) => !remove.has(item)), updatedAt: timestamp }
			: lane,
	);
	return writeCurrentMission({ ...mission, lanes });
}

export function autoModeDefaults(): {
	reasoning: "regex" | "llm";
	dispatch: "inline" | "specialist";
	swarmExecution: "simulated" | "real";
} {
	if (envBoolean("REPI_AUTOMODE_LEGACY")) {
		return { reasoning: "regex", dispatch: "inline", swarmExecution: "simulated" };
	}
	return { reasoning: "llm", dispatch: "specialist", swarmExecution: "real" };
}

export function laneExecutionStrategy(pack: LaneCommandPack): any {
	return autopilotExecutionStrategy(pack, bootstrapPlanForCommandPack(pack));
}
