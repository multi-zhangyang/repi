/** Narrative operator tool: re_operator. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerOperatorTool(registerTool: ToolRegistrar, pi: ExtensionAPI, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_operator",
		label: "RE Operator",
		description:
			"Plan, dispatch, verify, or escalate the REPI operator queue derived from context next_operator_commands.",
		promptSnippet:
			"Use re_operator after re_context to turn resume commands into a bounded executable queue with verification and escalation.",
		promptGuidelines: [
			"Call re_operator plan before dispatching a resumed mission.",
			"Call re_operator dispatch with a small maxSteps value, then re_operator verify.",
		],
		parameters: Type.Object({
			action: Type.Optional(
				Type.Union([
					Type.Literal("plan"),
					Type.Literal("show"),
					Type.Literal("dispatch"),
					Type.Literal("verify"),
					Type.Literal("escalate"),
				]),
			),
			target: Type.Optional(Type.String()),
			maxSteps: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text =
				action === "dispatch"
					? await deps.dispatchOperatorQueue(pi, { target: params.target, maxSteps: params.maxSteps })
					: deps.buildOperatorOutput(action, { target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestOperatorArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
