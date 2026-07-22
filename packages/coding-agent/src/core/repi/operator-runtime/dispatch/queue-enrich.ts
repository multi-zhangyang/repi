// pendingGates filled by caller context when available
/** Operator dispatch post-step enrichment (feedback/budget/reverse next). */

import {
	compactionResumeTelemetryPath,
	formatReconCompactionResumeTelemetry,
	updateReconCompactionTelemetryFromOperator,
} from "../deps.ts";
import {
	classifyOperatorFeedback,
	operatorEscalationQueue,
	operatorFeedbackDispatcherCommands,
	operatorFeedbackDispatchPlan,
} from "../feedback.ts";
import { autonomousExecutionBudget, isCommanderRuntimeCommand } from "./budget.ts";
import { dispatcherFeedbackScoreboard, dispatcherLearningHints } from "./feedback-score.ts";
import { operatorDispatchReverseNextActions } from "./queue-reverse.ts";

export function enrichOperatorAfterDispatch(params: { operator: any; retryLimit: number }): void {
	const { operator, retryLimit } = params;
	const runtimeFeedback = classifyOperatorFeedback(operator, undefined, operator.target);
	operator.operatorFeedback = Array.from(new Set([...(operator.operatorFeedback ?? []), ...runtimeFeedback])).slice(
		0,
		64,
	);
	operator.operatorFeedbackQueue = operatorFeedbackDispatcherCommands(operator.operatorFeedback, operator.target);
	operator.dispatcherFallbackPlan = operatorFeedbackDispatchPlan(operator.operatorFeedback, operator.target);
	operator.dispatcherFeedbackScoreboard = dispatcherFeedbackScoreboard(operator);
	operator.dispatcherLearningHints = dispatcherLearningHints(operator.dispatcherFeedbackScoreboard, operator.target);
	operator.autonomousBudget = autonomousExecutionBudget(operator.target, operator.dispatcherFeedbackScoreboard);
	operator.dispatcherScoreDecay = operator.autonomousBudget.scoreDecay;
	operator.repeatedFailureDemotions = operator.autonomousBudget.demotionRules;
	operator.highScorePromotions = operator.autonomousBudget.promotionRules;
	const compactTelemetry = updateReconCompactionTelemetryFromOperator(operator);
	if (compactTelemetry) {
		operator.compactResumeTelemetry = formatReconCompactionResumeTelemetry(compactTelemetry);
		operator.compactResumeQueue = compactTelemetry.commandStatus
			.filter((row: any) => row.status === "queued")
			.map((row: any) => row.command)
			.slice(0, 12);
		operator.commanderDispatchReport.push(
			`compact_resume_runtime queue=${operator.compactResumeQueue.length} proof_loop_entered=${compactTelemetry.proofLoopEntered} telemetry=${compactionResumeTelemetryPath()}`,
		);
	}
	if (operator.operatorFeedback.length) {
		operator.commanderDispatchReport.push(
			`operator_feedback_runtime rows=${operator.operatorFeedback.length} queue=${operator.operatorFeedbackQueue.length} dispatcher_fallback_plan=${operator.dispatcherFallbackPlan.length} dispatcher_feedback_scoreboard=${operator.dispatcherFeedbackScoreboard.length} dispatcher_learning_hints=${operator.dispatcherLearningHints.length} autonomous_budget=${operator.autonomousBudget.maxTurns}/${operator.autonomousBudget.maxDispatch} score_decay=${operator.dispatcherScoreDecay.length} demotions=${operator.repeatedFailureDemotions.length} promotions=${operator.highScorePromotions.length}`,
		);
	}
	const pendingGates: string[] = (operator as any).pendingGates ?? [];
	operator.escalationQueue = operatorEscalationQueue(operator.steps, pendingGates);
	const retryCommands = operator.steps
		.filter((step: any) => step.status === "blocked" && isCommanderRuntimeCommand(step.command))
		.slice(0, retryLimit)
		.map((step: any) => step.command);
	operator.nextActions = operator.steps
		.filter((step: any) => step.status === "ready")
		.slice(0, 8)
		.map((step: any) => `re_operator dispatch ${operator.target ?? "<target>"} 1 # ${step.id}`);
	operator.nextActions = operatorDispatchReverseNextActions({
		target: operator.target,
		operatorFeedbackQueue: operator.operatorFeedbackQueue,
		retryCommands,
		autonomousNext: operator.autonomousBudget?.nextActions,
		baseNext: operator.nextActions,
	});
}
