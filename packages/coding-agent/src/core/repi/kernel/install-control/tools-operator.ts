/** Control-plane lean tool: re_operator (bounded plan/dispatch/verify). */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import {
	appendOperatorCloseout,
	buildOperatorReadyStopText,
	checkpointDone,
	reverseProofDone,
	shouldStopOperatorThrash,
} from "./tools-operator-closeout.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export type ControlOperatorToolDeps = {
	buildOperatorOutput: (...args: any[]) => any;
	dispatchOperatorQueue: (...args: any[]) => any;
	latestOperatorArtifactPath: (...args: any[]) => any;
};

export function registerRepiControlOperatorTool(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ControlOperatorToolDeps,
): void {
	registerTool({
		name: "re_operator",
		label: "RE Operator",
		description:
			"Plan, dispatch, verify, or escalate a bounded REPI operator queue from reverse evidence and next commands.",
		promptSnippet:
			"Use re_operator plan then re_operator dispatch with small maxSteps after map/browser/domain proof.",
		promptGuidelines: [
			"Call re_operator plan before dispatch.",
			"Call re_operator dispatch with maxSteps 1-3, then re_operator verify.",
			"Do not treat optional pending checks as harness bugs when reverse proof is ready.",
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
			const action = params.action ?? (params.target ? "dispatch" : "plan");
			const reverseDone = reverseProofDone();
			if (shouldStopOperatorThrash(action)) {
				return {
					content: [{ type: "text" as const, text: buildOperatorReadyStopText() }],
					details: {
						action,
						skipped: true,
						reason: "reverse_ready_stop",
						target: params.target,
					} as Record<string, unknown>,
				};
			}
			const queueAlready = checkpointDone("operation_queue_ready") || checkpointDone("operator_queue_ready");
			let effectiveAction = action;
			let baseText =
				action === "dispatch"
					? await deps.dispatchOperatorQueue(pi, {
							target: params.target,
							maxSteps: params.maxSteps ?? 2,
						})
					: deps.buildOperatorOutput(action, { target: params.target });
			// Commercial closeout: models often call plan once and stop. When reverse is
			// already bound and queue was empty before plan, auto-run one dispatch after plan.
			let autoDispatched = false;
			if (reverseDone && action === "plan" && !queueAlready) {
				try {
					const planText = baseText;
					const dispatchText = await deps.dispatchOperatorQueue(pi, {
						target: params.target,
						maxSteps: params.maxSteps ?? 1,
					});
					baseText = `${planText}\n\n--- auto_dispatch ---\n${dispatchText}`;
					effectiveAction = "dispatch";
					autoDispatched = true;
				} catch {
					/* keep plan-only if dispatch fails */
				}
			}
			const { text, softReport } = appendOperatorCloseout({
				text: baseText,
				action: effectiveAction,
				target: params.target,
			});
			return {
				content: [{ type: "text" as const, text }],
				details: {
					action: effectiveAction,
					requestedAction: action,
					path: deps.latestOperatorArtifactPath?.(),
					target: params.target,
					reverseDone,
					softReport,
					autoDispatched,
				} as Record<string, unknown>,
			};
		},
	});
}
