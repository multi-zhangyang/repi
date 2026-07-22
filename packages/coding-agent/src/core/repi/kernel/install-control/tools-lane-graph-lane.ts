/** Control-plane tools: re_lane (execution surface; reverse/pentest command packs). */
// Landmark: re_lane plan run run-auto reverse/pentest registerRepiControlLaneTools
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ControlLaneGraphToolDeps } from "./tools-lane-deps.ts";
import { executeRepiLaneTool } from "./tools-lane-execute.ts";

export type { ControlLaneGraphToolDeps } from "./tools-lane-deps.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export function registerRepiControlLaneTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
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
			return executeRepiLaneTool(pi, deps, params);
		},
	});
}
