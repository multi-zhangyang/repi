/** Register REPI re_proof_loop tool. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiProofLoopTool(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	registerTool({
		name: "re_proof_loop",
		label: "RE Proof Loop",
		description:
			"Plan, show, or run a bounded REPI proof loop that chains verifier matrix, compiler draft/final, replay matrix, autofix repair, specialist delegate/swarm/supervisor bridge, knowledge graph, and completion audit.",
		promptSnippet:
			"Use re_proof_loop after decision/operator execution to close verifier→compiler→replayer→autofix and route partial/repair gaps into specialist_queue/swarm_bridge instead of stopping at narrative-only evidence.",
		promptGuidelines: [
			"Call re_proof_loop plan to inspect the exact proof/repair phases before final claims.",
			"Call re_proof_loop run with bounded maxSteps after re_decision_core run or re_operator dispatch.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("run")])),
			target: Type.Optional(Type.String()),
			maxSteps: Type.Optional(Type.Number()),
			replaySteps: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text =
				action === "run"
					? await deps.runProofLoop(pi, {
							target: params.target,
							maxSteps: params.maxSteps,
							replaySteps: params.replaySteps,
						})
					: deps.buildProofLoopOutput(action, {
							target: params.target,
							maxSteps: params.maxSteps,
							replaySteps: params.replaySteps,
						});
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestProofLoopArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
