/** Narrative tools group: swarm. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerRepiNarrativeDelegateTool(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	registerTool({
		name: "re_delegate",
		label: "RE Delegate",
		description:
			"Build, show, or merge specialist worker packets from the REPI operation queue for multi-expert reverse/pentest orchestration. Downstream swarm release still requires runtime capture proof.exit partial|strong + bind_ready",
		promptSnippet:
			"Use re_delegate after re_operation to split work into specialist packets and merge evidence contracts.",
		promptGuidelines: [
			"Require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true before claim promotion.",
			"Call re_delegate plan to create worker_packets before spreading across domains.",
			"Use each packet handoff/evidence_contract as the exact specialist subtask contract.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("merge")])),
			target: Type.Optional(Type.String()),
			task: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text = deps.buildDelegateOutput(action, { target: params.target, task: params.task });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestDelegateArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
