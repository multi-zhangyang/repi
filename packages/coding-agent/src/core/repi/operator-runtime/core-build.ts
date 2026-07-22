/** Operator queue builder with reverse domain next seeding. */

import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { assembleOperatorArtifact } from "./core-build-assemble.ts";
import { collectOperatorSteps } from "./core-build-steps.ts";
import { latestOrBuildContextPack, latestReconCompactionResumeTelemetry } from "./deps.ts";
import { commanderPolicyFromContext } from "./dispatch/hints.ts";
import { autonomousExecutionBudget, dispatcherFeedbackScoreboard, dispatcherLearningHints } from "./dispatch.ts";
import {
	latestOperatorFeedback,
	operatorEscalationQueue,
	operatorFeedbackDispatcherCommands,
	operatorFeedbackDispatchPlan,
	operatorVerificationLines,
} from "./feedback.ts";

export function buildOperator(options: { target?: string; mode?: string } = {}): any {
	ensureReconStorage();
	const { context, path: contextArtifact } = latestOrBuildContextPack(options);
	const target = options.target ?? context.target;
	const feedback = latestOperatorFeedback(target);
	const compactResume = latestReconCompactionResumeTelemetry();
	const compactResumeTelemetry = compactResume.lines;
	const compactResumeQueue = (compactResume.telemetry?.commandStatus ?? [])
		.filter((row: any) => row.status === "queued")
		.map((row: any) => row.command)
		.filter((command: any) => /^re[-_]/i.test(command));
	const dispatcherCommands = operatorFeedbackDispatcherCommands(feedback.rows, target);
	const dispatcherFallbackPlan = operatorFeedbackDispatchPlan(feedback.rows, target);
	const commanderPolicy = Array.from(
		new Set([
			...commanderPolicyFromContext(context),
			`compact_resume_queue=${compactResumeQueue.length}`,
			`compact_resume_telemetry=${compactResumeTelemetry.length}`,
			`operator_feedback_queue=${dispatcherCommands.length}`,
			`operator_feedback_rows=${feedback.rows.length}`,
			`dispatcher_fallback_plan=${dispatcherFallbackPlan.length}`,
			"feedback_priority=missing_tool→target→runtime→budget→swarm→exploit→evidence",
		]),
	).slice(0, 28);
	const sorted = collectOperatorSteps({
		target,
		context,
		compactResumeQueue,
		compactResumePath: compactResume.path,
		dispatcherCommands,
		feedbackSourceArtifacts: feedback.sourceArtifacts,
	});
	const pendingGates =
		readCurrentMission()
			?.checkpoints.filter((checkpoint: any) => checkpoint.status !== "done")
			.map((checkpoint: any) => checkpoint.name) ?? [];
	const verification = operatorVerificationLines(context, contextArtifact, sorted);
	const escalationQueue = operatorEscalationQueue(sorted, pendingGates);
	const dispatcherFeedbackScoreboardRows = dispatcherFeedbackScoreboard({
		operatorFeedback: feedback.rows,
		executed: [],
		target,
	});
	const dispatcherLearning = dispatcherLearningHints(dispatcherFeedbackScoreboardRows, target);
	const autonomousBudget = autonomousExecutionBudget(target, dispatcherFeedbackScoreboardRows);
	return assembleOperatorArtifact({
		context,
		contextArtifact,
		target,
		mode: options.mode,
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
		compactResumePath: compactResume.path,
		verification,
		escalationQueue,
	});
}
