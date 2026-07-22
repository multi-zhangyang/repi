/** Mission lane helpers: checkpoints, laneSpec, queue, activeLane. */

import { findLaneIndex } from "../lane-run-mission.ts";
import type { RoutePlan } from "../routes.ts";
import { MISSION_CHECKPOINTS_BY_DOMAIN, MISSION_CHECKPOINTS_CORE, MISSION_CHECKPOINTS_FULL } from "./checkpoints.ts";
import type { MissionCheckpoint, MissionLane, MissionState } from "./types.ts";

export function defaultMissionCheckpoints(route?: RoutePlan): MissionCheckpoint[] {
	// Memory product removed: memory_checked is satisfied by design (doctor memory:product-removed).
	const markMemory = (checkpoint: MissionCheckpoint): MissionCheckpoint =>
		checkpoint.name === "memory_checked" || checkpoint.name === "memory_or_evolution_written"
			? { ...checkpoint, status: "done", note: "memory:product-removed" }
			: { ...checkpoint };
	if (!route) return MISSION_CHECKPOINTS_FULL.map((checkpoint: any) => markMemory({ ...checkpoint }));
	const wanted = new Set([...MISSION_CHECKPOINTS_CORE, ...(MISSION_CHECKPOINTS_BY_DOMAIN[route.domain] ?? [])]);
	return MISSION_CHECKPOINTS_FULL.filter((checkpoint: any) => wanted.has(checkpoint.name)).map((checkpoint: any) =>
		markMemory({ ...checkpoint }),
	);
}

export function laneSpec(
	lane: MissionLane,
	route: RoutePlan,
): "explorer" | "reverser" | "operator" | "verifier" | undefined {
	const hay = `${lane.name} ${lane.objective} ${route.domain}`.toLowerCase();
	const has = (needle: string): boolean => hay.includes(needle);
	if (
		has("verif") ||
		has("proof") ||
		has("proof_exit") ||
		has("domain_proof") ||
		has("report") ||
		has("audit") ||
		has("supervisor") ||
		has("qa")
	) {
		return "verifier";
	}
	if (
		has("revers") ||
		has("pwn") ||
		has("firmware") ||
		has("malware") ||
		has("memory") ||
		has("dfir") ||
		has("pcap") ||
		has("crypto") ||
		has("native") ||
		has("mobile") ||
		has("exploit") ||
		has("primitive") ||
		has("mitigation") ||
		has("disasm") ||
		has("decompil") ||
		has("frida") ||
		has("objdump") ||
		has("rop") ||
		has("checksec")
	) {
		return "reverser";
	}
	if (
		has("map") ||
		has("surface") ||
		has("recon") ||
		has("passive") ||
		has("identity") ||
		has("web") ||
		has("cloud") ||
		has("enum") ||
		has("inventory") ||
		has("discover")
	) {
		return "explorer";
	}
	if (has("run") || has("execute") || has("command") || has("operate") || has("launch")) {
		return "operator";
	}
	return undefined;
}

export function formatLaneQueue(mission: MissionState): string {
	return [
		"lanes:",
		...mission.lanes.map((lane: any, index: any) =>
			[
				`- ${index + 1}. [${lane.status ?? "pending"}] ${lane.name}: ${lane.objective}`,
				...(lane.note ? [`  note: ${lane.note}`] : []),
				...lane.next.map((step: any) => `  - next: ${step}`),
			].join("\n"),
		),
	].join("\n");
}

export function activeLane(mission: MissionState, name?: string): MissionLane | undefined {
	const index = findLaneIndex(mission, name);
	return index >= 0 ? mission.lanes[index] : undefined;
}
