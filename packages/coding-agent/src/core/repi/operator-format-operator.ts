/** Format operator board with reverse domain next. */
/** Operator/delegate pure format helpers. */

// Landmark: reverseDomainCaptureNextCommands used via formatOperatorNextActions (operator-format-operator-next.ts)
import { autonomousBudgetLines } from "./operator-format-budget.ts";
import { formatOperatorNextActions } from "./operator-format-operator-next.ts";
import type { OperatorFormatView } from "./operator-format-types.ts";
import { truncateMiddle } from "./text.ts";
export function formatOperator(operator: OperatorFormatView, path?: string): string {
	return [
		"operator_queue:",
		path ? `operator_artifact: ${path}` : undefined,
		`timestamp: ${operator.timestamp}`,
		`mode: ${operator.mode}`,
		`mission_id: ${operator.missionId ?? "none"}`,
		`route: ${operator.route ?? "none"}`,
		`target: ${operator.target ?? "<none>"}`,
		`context_artifact: ${operator.contextArtifact ?? "none"}`,
		"dispatcher_policy:",
		"- priority: bootstrap/tool-index → map/plan → runtime/graph → campaign/operation/delegate → supervisor/reflect → context/memory → verifier/compiler → replayer/autofix → knowledge-graph → completion",
		"- feedback_priority: operator_feedback_queue is promoted ahead of context commands; fallback plan reroutes missing tools, unresolved targets, runtime failure, swarm retry, and exploit/replay candidates",
		"- bounded_dispatch: default max=1, hard max=10, unsupported commands become escalation items",
		"commander_runtime_policy:",
		...(operator.commanderPolicy.length ? operator.commanderPolicy.map((item: any) => `- ${item}`) : ["- none"]),
		"compact_resume_telemetry:",
		...((operator.compactResumeTelemetry ?? []).length
			? (operator.compactResumeTelemetry ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"compact_resume_queue:",
		...((operator.compactResumeQueue ?? []).length
			? (operator.compactResumeQueue ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"operator_feedback:",
		...((operator.operatorFeedback ?? []).length
			? (operator.operatorFeedback ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"operator_feedback_queue:",
		...((operator.operatorFeedbackQueue ?? []).length
			? (operator.operatorFeedbackQueue ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"dispatcher_fallback_plan:",
		...((operator.dispatcherFallbackPlan ?? []).length
			? (operator.dispatcherFallbackPlan ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"dispatcher_feedback_scoreboard:",
		...((operator.dispatcherFeedbackScoreboard ?? []).length
			? (operator.dispatcherFeedbackScoreboard ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"dispatcher_learning_hints:",
		...((operator.dispatcherLearningHints ?? []).length
			? (operator.dispatcherLearningHints ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"autonomous_execution_budget:",
		...autonomousBudgetLines(operator.autonomousBudget).map((item: any) => `- ${item}`),
		"dispatcher_score_decay:",
		...((operator.dispatcherScoreDecay ?? []).length
			? (operator.dispatcherScoreDecay ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"repeated_failure_demotions:",
		...((operator.repeatedFailureDemotions ?? []).length
			? (operator.repeatedFailureDemotions ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"high_score_promotions:",
		...((operator.highScorePromotions ?? []).length
			? (operator.highScorePromotions ?? []).map((item: any) => `- ${item}`)
			: ["- none"]),
		"steps:",
		...(operator.steps.length
			? operator.steps.map(
					(step: any) =>
						`- ${step.id} [${step.status}] p=${step.priority} command=${step.command}${step.reason ? ` reason=${step.reason}` : ""}`,
				)
			: ["- none"]),
		`executed_steps: ${operator.executed.length}`,
		...(operator.executed.length
			? operator.executed.map(
					(item: any) =>
						`- ${item.stepId} [${item.status}] ${item.command} :: ${truncateMiddle(item.output.replace(/\s+/g, " "), 260)}`,
				)
			: []),
		"commander_dispatch_report:",
		...(operator.commanderDispatchReport.length
			? operator.commanderDispatchReport.map((item: any) => `- ${item}`)
			: ["- none"]),
		"case_memory_lane_plan:",
		"- removed",
		"case_memory_dispatch_report:",
		"- removed",
		"verification_matrix:",
		...(operator.verification.length ? operator.verification.map((item: any) => `- ${item}`) : ["- none"]),
		"escalation_queue:",
		...(operator.escalationQueue.length ? operator.escalationQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_next_actions:",
		...formatOperatorNextActions(operator),
		`next_operator_command: ${operator.mode === "dispatch" ? "re_operator verify" : `re_operator dispatch ${operator.target ?? "<target>"} 1`}`,
		"source_artifacts:",
		...(operator.sourceArtifacts.length ? operator.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
