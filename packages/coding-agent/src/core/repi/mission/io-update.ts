import { applyLaneCheckpointCompletions } from "../lane-run-mission/helpers.ts";
import { findLaneIndex } from "../lane-run-mission.ts";
import { routeRepiTask } from "../routes.ts";
import { createMission } from "./io-create.ts";

import { readCurrentMission, writeCurrentMission } from "./io-read-write.ts";
/** Mission create/read/write/update helpers. */
import type {
	MissionCheckpoint,
	MissionCheckpointStatus,
	MissionLane,
	MissionLaneStatus,
	MissionState,
} from "./types.ts";
export function updateMissionLane(params: {
	action: "next" | "done" | "block" | "set" | "add";
	lane?: string;
	status?: MissionLaneStatus;
	objective?: string;
	next?: string[];
	note?: string;
}): MissionState {
	const mission = readCurrentMission() ?? createMission("manual mission", routeRepiTask("reverse/pentest task"));
	const timestamp = new Date().toISOString();
	if (params.action === "add") {
		const lane: MissionLane = {
			name: params.lane ?? `lane-${mission.lanes.length + 1}`,
			objective: params.objective ?? "manual lane",
			next: params.next ?? [],
			status: mission.lanes.some((candidate: any) => candidate.status === "in_progress") ? "pending" : "in_progress",
			note: params.note,
			updatedAt: timestamp,
		};
		return writeCurrentMission({ ...mission, lanes: [...mission.lanes, lane] });
	}

	const index = findLaneIndex(mission, params.lane);
	if (index < 0) return mission;
	const lane = mission.lanes[index]!;
	let nextStatus: MissionLaneStatus;
	if (params.action === "done") nextStatus = "done";
	else if (params.action === "block") nextStatus = "blocked";
	else if (params.action === "set") nextStatus = params.status ?? "in_progress";
	else nextStatus = "in_progress";

	const lanes = mission.lanes.map((candidate: any, candidateIndex: any) => {
		if (candidateIndex === index) {
			return { ...candidate, status: nextStatus, note: params.note ?? candidate.note, updatedAt: timestamp };
		}
		if (nextStatus === "in_progress" && candidate.status === "in_progress") {
			return { ...candidate, status: "pending" as const, updatedAt: timestamp };
		}
		return candidate;
	});
	if (params.action === "done") {
		const nextPending = lanes.findIndex(
			(candidate, candidateIndex) => candidateIndex > index && candidate.status === "pending",
		);
		if (nextPending >= 0)
			lanes[nextPending] = { ...lanes[nextPending]!, status: "in_progress", updatedAt: timestamp };
		return writeCurrentMission({
			...mission,
			lanes,
			checkpoints: applyLaneCheckpointCompletions(mission.checkpoints, lane.name),
		});
	}
	return writeCurrentMission({ ...mission, lanes });
}

export function updateMissionCheckpoint(name: string, status: MissionCheckpointStatus, note?: string): MissionState {
	const mission = readCurrentMission() ?? createMission("manual mission", routeRepiTask("reverse/pentest task"));
	const updatedAt = new Date().toISOString();
	const checkpoints = mission.checkpoints.some((checkpoint: any) => checkpoint.name === name)
		? mission.checkpoints.map((checkpoint: any) =>
				checkpoint.name === name ? { ...checkpoint, status, note, updatedAt } : checkpoint,
			)
		: [...mission.checkpoints, { name, status, note, updatedAt }];
	return writeCurrentMission({ ...mission, checkpoints });
}

export function upsertMissionCheckpoint(
	checkpoints: MissionCheckpoint[],
	name: string,
	status: MissionCheckpointStatus,
	note?: string,
): MissionCheckpoint[] {
	const updatedAt = new Date().toISOString();
	if (checkpoints.some((checkpoint: any) => checkpoint.name === name)) {
		return checkpoints.map((checkpoint: any) =>
			checkpoint.name === name ? { ...checkpoint, status, note, updatedAt } : checkpoint,
		);
	}
	return [...checkpoints, { name, status, note, updatedAt }];
}
