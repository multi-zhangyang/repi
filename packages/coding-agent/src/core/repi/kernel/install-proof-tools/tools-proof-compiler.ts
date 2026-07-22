/** Register REPI re_compiler tool. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiCompilerTool(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	registerTool({
		name: "re_compiler",
		label: "RE Compiler",
		description:
			"Compile REPI verifier matrices into final report scaffolds, key evidence blocks, repro commands, contradictions, gaps, and next operator queues.",
		promptSnippet:
			"Use re_compiler after re_verifier matrix to turn proved/weak/contradicted/missing assertions into a final writeup skeleton.",
		promptGuidelines: [
			"Call re_compiler draft after re_verifier matrix and before re_complete audit.",
			"Use next_operator_queue when weak/missing/contradicted assertions remain.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("draft"), Type.Literal("show"), Type.Literal("final")])),
			target: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "draft";
			const text = deps.buildCompilerOutput(action, { target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestCompilerArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
