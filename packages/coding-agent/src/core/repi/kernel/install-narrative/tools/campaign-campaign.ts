/** Narrative campaign tool: re_campaign. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerCampaignTool(registerTool: ToolRegistrar, _pi: ExtensionAPI, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_campaign",
		label: "RE Campaign",
		description:
			"Build or show a cross-domain REPI reverse/pentest campaign graph from mission, passive map, attack graph, lane runs, evidence, pivots, and tool gaps.",
		promptSnippet:
			"Use re_campaign to upgrade a single lane into a multi-phase campaign graph with pivots and operator actions.",
		promptGuidelines: [
			"Call re_campaign plan after re_map/re_graph or before expanding sideways across web, identity, cloud, pwn, firmware, DFIR, malware, or agent-security lanes.",
			"Use campaign_graph phases, pivot_candidates, evidence_gaps, tool_gaps, and operator_next_actions as the next execution queue.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show")])),
			target: Type.Optional(Type.String()),
			task: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text = deps.buildCampaignOutput(action, { target: params.target, task: params.task });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestCampaignArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
