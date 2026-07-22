/** Adaptive multi-lane plan helpers. */

import { readCurrentMission } from "../mission.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { truncateMiddle } from "../text.ts";
import { adaptiveRepairLaneSpec } from "./adaptive-repair-spec.ts";
import type { MultiLanePlan } from "./deps.ts";
import { writeCurrentMission } from "./deps.ts";
import { findLaneIndex } from "./helpers.ts";

// Landmark: tool-bootstrap / evidence-repair / map-refresh (body in adaptive-repair-spec.ts)

export { adaptiveRepairLaneSpec } from "./adaptive-repair-spec.ts";

export function formatMultiLanePlan(plan: MultiLanePlan): string {
	return [
		"multi_lane_plan:",
		`action: ${plan.action}`,
		plan.lane ? `lane: ${plan.lane}` : undefined,
		`reason: ${plan.reason}`,
		...(plan.next.length > 0 ? ["next:", ...plan.next.map((item: any) => `- ${item}`)] : []),
	]
		.filter(Boolean)
		.join("\n");
}

function seedReverseAdaptiveCommands(routeBlob: string, target?: string): string[] {
	return reverseDomainCaptureNextCommands({ routeOrBlob: routeBlob, target }).slice(0, 3);
}

export function applyAdaptiveMultiLanePlan(params: {
	lane: any;
	decision: any;
	text: string;
	target?: string;
}): MultiLanePlan {
	const mission = readCurrentMission();
	if (!mission) return { action: "none", reason: "no_active_mission", next: [] };
	const spec = adaptiveRepairLaneSpec({
		lane: params.lane,
		decision: params.decision,
		text: params.text,
		target: params.target,
	});
	const timestamp = new Date().toISOString();
	const currentIndex = findLaneIndex(mission, params.lane.name);
	const existingIndex = mission.lanes.findIndex((lane: any) => lane.name === spec.name);
	const existing = existingIndex >= 0 ? mission.lanes[existingIndex] : undefined;
	const mergedNext = [...(existing?.next ?? [])];
	for (const item of spec.next) {
		if (!mergedNext.includes(item)) mergedNext.push(item);
	}
	const plannerLane: any = {
		name: spec.name,
		objective: spec.objective,
		next: mergedNext,
		status: "in_progress",
		note: `adaptive_from=${params.lane.name}; reason=${params.decision.reason}`,
		updatedAt: timestamp,
	};
	const withoutExisting = mission.lanes.filter((_: any, index: any) => index !== existingIndex);
	const insertAfter = Math.max(
		0,
		currentIndex >= 0 ? currentIndex + (existingIndex >= 0 && existingIndex < currentIndex ? 0 : 1) : 0,
	);
	const nextLanes = [...withoutExisting];
	nextLanes.splice(Math.min(insertAfter, nextLanes.length), 0, plannerLane);
	const lanes = nextLanes.map((lane: any) => {
		if (lane.name === plannerLane.name) return lane;
		if (lane.name === params.lane.name) {
			return {
				...lane,
				status: spec.blockCurrent ? ("blocked" as const) : ("pending" as const),
				note: truncateMiddle(`adaptive_handoff=${plannerLane.name}; reason=${params.decision.reason}`, 500),
				updatedAt: timestamp,
			};
		}
		if (lane.status === "in_progress") return { ...lane, status: "pending" as const, updatedAt: timestamp };
		return lane;
	});
	writeCurrentMission({ ...mission, lanes });
	return {
		action: existing ? "reprioritized" : "added",
		lane: plannerLane.name,
		reason: params.decision.reason,
		next: Array.from(
			new Set([
				...spec.next,
				...seedReverseAdaptiveCommands(
					`${params.decision?.reason ?? ""} ${plannerLane?.name ?? ""}`,
					params.target,
				),
			]),
		).slice(0, 12),
	};
}
