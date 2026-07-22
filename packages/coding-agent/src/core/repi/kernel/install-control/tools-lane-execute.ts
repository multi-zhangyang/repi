/** re_lane tool execute handlers. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ControlLaneGraphToolDeps } from "./tools-lane-deps.ts";

export async function executeRepiLaneTool(
	pi: ExtensionAPI,
	deps: ControlLaneGraphToolDeps,
	params: any,
): Promise<{ content: Array<{ type: "text"; text: string }>; details: Record<string, unknown> }> {
	if (params.action === "show") {
		const mission = deps.readCurrentMission();
		return {
			content: [{ type: "text" as const, text: mission ? deps.formatLaneQueue(mission) : "no active mission" }],
			details: { path: deps.currentMissionPath() } as Record<string, unknown>,
		};
	}
	if (params.action === "run-auto") {
		const text = await deps.runAutoLaneChain(pi, {
			lane: params.lane,
			target: params.target,
			maxSteps: params.max,
		});
		return {
			content: [{ type: "text" as const, text }],
			details: { path: deps.currentMissionPath() } as Record<string, unknown>,
		};
	}
	if (params.action === "plan" || params.action === "run") {
		const mission =
			deps.readCurrentMission() ??
			deps.writeCurrentMission(deps.createMission("manual mission", deps.routeReconTask("reverse/pentest task")));
		const lane = deps.activeLane(mission, params.lane);
		if (!lane) {
			return {
				content: [{ type: "text" as const, text: "no active lane" }],
				details: { path: deps.currentMissionPath() } as Record<string, unknown>,
			};
		}
		deps.updateMissionCheckpoint("repro_commands_ready", "done", `lane-command-pack:${lane.name}`);
		const pack = deps.laneCommandPack(mission, lane, params.target);
		const text = params.action === "run" ? await deps.runLaneCommandPack(pi, pack) : deps.formatLaneCommandPack(pack);
		return {
			content: [{ type: "text" as const, text }],
			details: pack as unknown as Record<string, unknown>,
		};
	}
	const mission = deps.updateMissionLane({
		action: params.action,
		lane: params.lane,
		status: params.status,
		objective: params.objective,
		next: params.next,
		note: params.note,
	});
	return {
		content: [{ type: "text" as const, text: deps.formatLaneQueue(mission) }],
		details: mission as unknown as Record<string, unknown>,
	};
}
