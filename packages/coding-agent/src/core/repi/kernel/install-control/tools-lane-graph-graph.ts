/** Control-plane tools: re_graph (attack graph surface). */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ControlLaneGraphToolDeps } from "./tools-lane-deps.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export function registerRepiControlGraphTools(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: ControlLaneGraphToolDeps,
): void {
	registerTool({
		name: "re_graph",
		label: "RE Graph",
		description: "Build or show the REPI attack graph bound to mission evidence and reverse proof anchors.",
		promptSnippet: "Use re_graph build after map/browser/runtime capture to bind attack paths and next hops.",
		promptGuidelines: [
			"Call re_graph build after re_map / re_live_browser when reverse evidence exists.",
			"Use re_graph show to inspect the latest graph artifact without rebuilding.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("build"), Type.Literal("show")])),
			target: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "build";
			const text = deps.buildAttackGraphOutput(action);
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestAttackGraphArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
