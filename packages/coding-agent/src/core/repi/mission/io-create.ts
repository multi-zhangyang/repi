/** Mission create/normalize helpers. */
import { createHash } from "node:crypto";
import type { RoutePlan } from "../routes.ts";
import { defaultMissionCheckpoints, initializeMissionLanes, missionLanesForRoute } from "./lanes.ts";
/** Mission create/read/write/update helpers. */
import type { MissionState } from "./types.ts";

export function createMission(task: string, route: RoutePlan): MissionState {
	const timestamp = new Date().toISOString();
	const id = createHash("sha256").update(`${timestamp}\n${route.domain}\n${task}`).digest("hex").slice(0, 12);
	return {
		id,
		createdAt: timestamp,
		updatedAt: timestamp,
		task,
		route,
		lanes: initializeMissionLanes(missionLanesForRoute(route)),
		checkpoints: defaultMissionCheckpoints(route),
	};
}

export function normalizeMission(mission: MissionState): MissionState {
	let sawActive = false;
	const timestamp = new Date().toISOString();
	const lanes = mission.lanes.map((lane: any, index: any) => {
		const status = lane.status ?? (index === 0 ? "in_progress" : "pending");
		if (status === "in_progress") sawActive = true;
		return { ...lane, status, updatedAt: lane.updatedAt ?? timestamp };
	});
	if (!sawActive) {
		const firstPending = lanes.findIndex((lane: any) => lane.status === "pending");
		if (firstPending >= 0)
			lanes[firstPending] = { ...lanes[firstPending], status: "in_progress", updatedAt: timestamp };
	}
	const checkpoints = (mission.checkpoints ?? []).map((checkpoint: any) =>
		checkpoint.name === "memory_checked" && checkpoint.status !== "done"
			? { ...checkpoint, status: "done", note: checkpoint.note ?? "memory:product-removed" }
			: checkpoint,
	);
	return { ...mission, lanes, checkpoints };
}
