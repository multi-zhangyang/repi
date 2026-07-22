/** Control-plane lean tool: re_operator (bounded plan/dispatch/verify). */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { auditCompletion } from "../../completion-audit.ts";
import { readCurrentMission } from "../../mission.ts";

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
			// After reverse proof is ready, further plan/dispatch thrash is wasted — steer to final report.
			try {
				const audit = auditCompletion();
				const mission = readCurrentMission();
				const queueDone = Boolean(
					mission?.checkpoints?.some(
						(c: { name?: string; status?: string }) =>
							(c.name === "operation_queue_ready" || c.name === "operator_queue_ready") && c.status === "done",
					),
				);
				// Only stop thrash after reverse is ready *and* an operator queue was already materialised.
				// First plan/dispatch after map/browser/proof must still run.
				if (
					audit?.ready &&
					queueDone &&
					(action === "plan" || action === "dispatch" || action === "verify" || action === "escalate")
				) {
					const text = [
						"operator_queue:",
						"status: reverse_ready_stop",
						"completion_status: ready",
						"note: reverse_runtime_gate already satisfied; do not plan/dispatch more steps",
						"next: write HARNESS_BUGS/PROOF only (or re_complete scaffold if report needed)",
					].join("\n");
					return {
						content: [{ type: "text" as const, text }],
						details: {
							action,
							skipped: true,
							reason: "reverse_ready_stop",
							target: params.target,
						} as Record<string, unknown>,
					};
				}
			} catch {
				/* audit optional */
			}
			const text =
				action === "dispatch"
					? await deps.dispatchOperatorQueue(pi, {
							target: params.target,
							maxSteps: params.maxSteps ?? 2,
						})
					: deps.buildOperatorOutput(action, { target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: {
					action,
					path: deps.latestOperatorArtifactPath?.(),
					target: params.target,
				} as Record<string, unknown>,
			};
		},
	});
}
