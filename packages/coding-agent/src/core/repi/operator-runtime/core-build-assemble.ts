/** Assemble operator artifact payload. */

import { existsSync } from "node:fs";
import { operatorReverseNextActions } from "./core-build-reverse.ts";
import { caseMemoryLanePlanLines } from "./deps.ts";

export function assembleOperatorArtifact(params: {
	context: any;
	contextArtifact?: string;
	target?: string;
	mode?: string;
	sorted: any[];
	commanderPolicy: string[];
	feedback: any;
	dispatcherCommands: string[];
	dispatcherFallbackPlan: any;
	dispatcherFeedbackScoreboardRows: any;
	dispatcherLearning: any;
	autonomousBudget: any;
	compactResumeTelemetry: any;
	compactResumeQueue: any;
	compactResumePath?: string;
	verification: any;
	escalationQueue: any;
}): any {
	const {
		context,
		contextArtifact,
		target,
		mode,
		sorted,
		commanderPolicy,
		feedback,
		dispatcherCommands,
		dispatcherFallbackPlan,
		dispatcherFeedbackScoreboardRows,
		dispatcherLearning,
		autonomousBudget,
		compactResumeTelemetry,
		compactResumeQueue,
		compactResumePath,
		verification,
		escalationQueue,
	} = params;
	return {
		timestamp: new Date().toISOString(),
		missionId: context.missionId,
		route: context.route,
		target,
		mode: mode ?? "plan",
		contextArtifact,
		steps: sorted,
		executed: [],
		commanderPolicy: Array.from(
			new Set([
				...commanderPolicy,
				`max_turns=${autonomousBudget.maxTurns}`,
				`max_dispatch=${autonomousBudget.maxDispatch}`,
				`max_proof_loops=${autonomousBudget.maxProofLoops}`,
				`retry_limit_per_worker=${autonomousBudget.maxWorkerRetries}`,
				`failure_budget=${Math.max(1, Math.min(autonomousBudget.maxDispatch, autonomousBudget.maxWorkerRetries))}`,
				`autonomous_budget=max_turns:${autonomousBudget.maxTurns},max_dispatch:${autonomousBudget.maxDispatch},max_proof_loops:${autonomousBudget.maxProofLoops},max_worker_retries:${autonomousBudget.maxWorkerRetries}`,
				`score_decay=${autonomousBudget.scoreDecay.length}; demotions=${autonomousBudget.demotionRules.length}; promotions=${autonomousBudget.promotionRules.length}`,
			]),
		).slice(0, 34),
		commanderDispatchReport: [],
		caseMemoryLanePlan: context.caseMemoryLanePlan,
		caseMemoryDispatchReport: caseMemoryLanePlanLines(context.caseMemoryLanePlan),
		operatorFeedback: feedback.rows,
		operatorFeedbackQueue: dispatcherCommands,
		dispatcherFallbackPlan,
		dispatcherFeedbackScoreboard: dispatcherFeedbackScoreboardRows,
		dispatcherLearningHints: dispatcherLearning,
		autonomousBudget,
		dispatcherScoreDecay: autonomousBudget.scoreDecay,
		repeatedFailureDemotions: autonomousBudget.demotionRules,
		highScorePromotions: autonomousBudget.promotionRules,
		compactResumeTelemetry,
		compactResumeQueue,
		verification,
		escalationQueue,
		nextActions: Array.from(
			new Set([
				...autonomousBudget.nextActions,
				...operatorReverseNextActions(target, context.route),
				...sorted
					.filter((step: any) => step.status === "ready")
					.slice(0, 8)
					.map((step: any) => `re_operator dispatch ${target ?? "<target>"} 1 # ${step.id}`),
			]),
		).slice(0, 12),
		sourceArtifacts: Array.from(
			new Set(
				[
					contextArtifact,
					autonomousBudget.dispatcherBoardPath && existsSync(autonomousBudget.dispatcherBoardPath)
						? autonomousBudget.dispatcherBoardPath
						: undefined,
					autonomousBudget.promotionPlaybookPath && existsSync(autonomousBudget.promotionPlaybookPath)
						? autonomousBudget.promotionPlaybookPath
						: undefined,
					compactResumePath && existsSync(compactResumePath) ? compactResumePath : undefined,
					...context.sourceArtifacts,
					...feedback.sourceArtifacts,
				].filter((path): path is string => Boolean(path) && existsSync(path)),
			),
		).slice(0, 40),
	};
}
