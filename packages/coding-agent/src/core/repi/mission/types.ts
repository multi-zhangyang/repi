/** Mission types. */
import type { RoutePlan } from "../routes.ts";

export type MissionCheckpointStatus = "pending" | "done" | "blocked";
export type MissionLaneStatus = "pending" | "in_progress" | "done" | "blocked";

export type MissionCheckpoint = {
	name: string;
	status: MissionCheckpointStatus;
	note?: string;
	updatedAt?: string;
};

export type MissionLane = {
	name: string;
	objective: string;
	next: string[];
	status?: MissionLaneStatus;
	note?: string;
	updatedAt?: string;
};

export type MissionState = {
	target?: string;
	id: string;
	createdAt: string;
	updatedAt: string;
	task: string;
	route: RoutePlan;
	lanes: MissionLane[];
	checkpoints: MissionCheckpoint[];
	/** Long-run: full lean cold-start already injected for this mission. */
	coldStartInjected?: boolean;
	coldStartInjectedAt?: string;
	coldStartRouteDomain?: string;
};
