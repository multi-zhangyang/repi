/** Narrative campaign tool: re_autopilot. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerAutopilotTool(registerTool: ToolRegistrar, pi: ExtensionAPI, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_autopilot",
		label: "RE Autopilot",
		description:
			"Run a bounded REPI automation chain: mission routing, re_map, case_memory_lane_plan, bootstrap_plan, lane command pack/run, run-auto follow-ups, completion audit, and field-journal checkpoint.",
		promptSnippet:
			"Use re_autopilot to execute the full map→case-memory-lane-plan→bootstrap→prove→audit loop when the target is concrete.",
		promptGuidelines: [
			"Prefer action=plan when the target is still ambiguous.",
			"Review bootstrap_plan and run re_bootstrap plan/install only when missing tools are required.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("run")])),
			task: Type.Optional(Type.String()),
			target: Type.Optional(Type.String()),
			lane: Type.Optional(Type.String()),
			mapDepth: Type.Optional(Type.Number()),
			maxAutoSteps: Type.Optional(Type.Number()),
			runAuto: Type.Optional(Type.Boolean()),
			cleanState: Type.Optional(Type.Boolean()),
			reasoning: Type.Optional(Type.Union([Type.Literal("regex"), Type.Literal("llm")])),
			dispatch: Type.Optional(Type.Union([Type.Literal("inline"), Type.Literal("specialist")])),
		}),
		async execute(_toolCallId, params: any, _signal, _onUpdate, ctx) {
			const text = await deps.runAutopilot(pi, {
				action: params.action,
				task: params.task,
				target: params.target,
				lane: params.lane,
				mapDepth: params.mapDepth,
				maxAutoSteps: params.maxAutoSteps,
				runAuto: params.runAuto,
				cleanState: params.cleanState,
				reasoning: params.reasoning,
				dispatch: params.dispatch,
				cwd: ctx?.cwd,
			});
			return {
				content: [{ type: "text" as const, text }],
				details: { path: deps.currentMissionPath(), target: params.target ?? "<auto>" } as Record<string, unknown>,
			};
		},
	});
}
