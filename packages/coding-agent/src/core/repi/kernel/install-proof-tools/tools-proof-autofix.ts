/** Register REPI re_autofix tool. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiAutofixTool(registerTool: ToolRegistrar, _pi: ExtensionAPI, deps: ProofLoopToolDeps): void {
	registerTool({
		name: "re_autofix",
		label: "RE Autofix",
		description: "Plan, show, or apply REPI repair queues from replay failed/blocked rows and compiler gaps.",
		promptSnippet: "Use re_autofix after re_replayer run when replay_matrix has blocked or failed rows.",
		promptGuidelines: [
			"Call re_autofix plan after replay failures to generate patch_queue, command_substitutions, bootstrap_queue, and evidence_recapture_queue.",
			"Call re_autofix apply to persist the selected repair queue into mission memory before another replay.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("apply")])),
			target: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text = deps.buildAutofixOutput(action, { target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestAutofixArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
