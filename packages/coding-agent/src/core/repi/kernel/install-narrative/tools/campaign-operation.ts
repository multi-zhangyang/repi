/** Narrative campaign tool: re_operation. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerOperationTool(registerTool: ToolRegistrar, pi: ExtensionAPI, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_operation",
		label: "RE Operation",
		description:
			"Build, inspect, or run a bounded REPI operation queue from the campaign graph and dispatch phase steps through internal runners.",
		promptSnippet:
			"Use re_operation after re_campaign to turn phases into a concrete execution queue and run one bounded step.",
		promptGuidelines: [
			"Call re_operation plan/next to inspect the queue before broad execution.",
			"Call re_operation run with maxSteps bounded to dispatch only concrete internal commands and write operation artifacts.",
		],
		parameters: Type.Object({
			action: Type.Optional(
				Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("next"), Type.Literal("run")]),
			),
			target: Type.Optional(Type.String()),
			task: Type.Optional(Type.String()),
			maxSteps: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text =
				action === "run"
					? await deps.runOperationQueue(pi, {
							target: params.target,
							task: params.task,
							maxSteps: params.maxSteps,
						})
					: deps.buildOperationOutput(action, { target: params.target, task: params.task });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestOperationArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
