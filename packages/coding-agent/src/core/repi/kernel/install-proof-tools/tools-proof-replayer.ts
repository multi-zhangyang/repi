/** Register REPI re_replayer tool. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiReplayerTool(registerTool: ToolRegistrar, pi: ExtensionAPI, deps: ProofLoopToolDeps): void {
	registerTool({
		name: "re_replayer",
		label: "RE Replayer",
		description:
			"Plan, show, or execute a bounded replay matrix from REPI compiler repro_commands, recording exit codes, output hashes, blocked commands, and next actions.",
		promptSnippet:
			"Use re_replayer after re_compiler draft/final to prove report repro commands still execute and to capture stdout/stderr hashes.",
		promptGuidelines: [
			"Call re_replayer plan to inspect concrete replay commands before execution.",
			"Call re_replayer run with a small maxSteps value to produce replay_matrix evidence.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("run")])),
			target: Type.Optional(Type.String()),
			maxSteps: Type.Optional(Type.Number()),
			timeoutMs: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text =
				action === "run"
					? await deps.runReplayer(pi, {
							target: params.target,
							maxSteps: params.maxSteps,
							timeoutMs: params.timeoutMs,
						})
					: deps.buildReplayerOutput(action, { target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestReplayerArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
