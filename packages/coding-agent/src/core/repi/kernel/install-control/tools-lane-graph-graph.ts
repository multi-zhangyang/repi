/** Control-plane tools: re_lane + re_graph (execution/graph surface). */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export type ControlLaneGraphToolDeps = {
	activeLane: (...args: any[]) => any;
	buildAttackGraphOutput: (...args: any[]) => any;
	createMission: (...args: any[]) => any;
	currentMissionPath: (...args: any[]) => any;
	formatLaneCommandPack: (...args: any[]) => any;
	formatLaneQueue: (...args: any[]) => any;
	laneCommandPack: (...args: any[]) => any;
	latestAttackGraphArtifactPath: (...args: any[]) => any;
	readCurrentMission: (...args: any[]) => any;
	routeReconTask: (...args: any[]) => any;
	runAutoLaneChain: (...args: any[]) => any;
	runLaneCommandPack: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	updateMissionLane: (...args: any[]) => any;
	writeCurrentMission: (...args: any[]) => any;
};

export function registerRepiControlGraphTools(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: ControlLaneGraphToolDeps,
): void {
	registerTool({
		name: "re_lane",
		label: "RE Lane",
		description: "Show, advance, complete, block, set, add, plan, run, or run-auto REPI mission lanes.",
		promptSnippet:
			"Use mission lanes as an executable queue with generated command packs for reverse/pentest workflows.",
		promptGuidelines: [
			"Call re_lane next to focus the active lane.",
			"Call re_lane plan with a lane/target to generate the smallest command pack before broad scanning.",
		],
		parameters: Type.Object({
			action: Type.Union([
				Type.Literal("show"),
				Type.Literal("next"),
				Type.Literal("done"),
				Type.Literal("block"),
				Type.Literal("set"),
				Type.Literal("add"),
				Type.Literal("plan"),
				Type.Literal("run"),
				Type.Literal("run-auto"),
			]),
			lane: Type.Optional(Type.String()),
			target: Type.Optional(Type.String()),
			max: Type.Optional(Type.Number()),
			status: Type.Optional(
				Type.Union([
					Type.Literal("pending"),
					Type.Literal("in_progress"),
					Type.Literal("done"),
					Type.Literal("blocked"),
				]),
			),
			objective: Type.Optional(Type.String()),
			next: Type.Optional(Type.Array(Type.String())),
			note: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const text = deps.buildAttackGraphOutput(params.action);
			return {
				content: [{ type: "text" as const, text }],
				details: { action: params.action, path: deps.latestAttackGraphArtifactPath() } as Record<string, unknown>,
			};
		},
	});
}
