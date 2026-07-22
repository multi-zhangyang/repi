/** Proof-loop markdown section list builders. */

import { autonomousBudgetLines } from "../operator-format.ts";
import { truncateMiddle } from "../text.ts";
import { caseMemoryLanePlanLines } from "./format-case.ts";
import type { ProofLoopArtifact } from "./types.ts";

export function proofLoopBodySections(proof: ProofLoopArtifact, path?: string): string[] {
	return [
		"proof_loop:",
		path ? `proof_loop_artifact: ${path}` : undefined,
		`timestamp: ${proof.timestamp}`,
		`mode: ${proof.mode}`,
		`mission_id: ${proof.missionId ?? "none"}`,
		`route: ${proof.route ?? "none"}`,
		`target: ${proof.target ?? "<none>"}`,
		`max_steps: ${proof.maxSteps}`,
		`replay_steps: ${proof.replaySteps}`,
		`verdict: ${proof.verdict}`,
		"check_status:",
		...(proof.checkStatus.length ? proof.checkStatus.map((item: any) => `- ${item}`) : ["- none"]),
		"evidence_summary:",
		...(proof.evidenceSummary.length ? proof.evidenceSummary.map((item: any) => `- ${item}`) : ["- none"]),
		"gap_classifier:",
		...(proof.gapClassifier.length ? proof.gapClassifier.map((item: any) => `- ${item}`) : ["- none"]),
		"quickpath:",
		...(proof.quickPath.length ? proof.quickPath.map((item: any) => `- ${item}`) : ["- none"]),
		"quick_plan_phases:",
		...(proof.quickPlanPhases.length ? proof.quickPlanPhases.map((item: any) => `- ${item}`) : ["- none"]),
		"quick_plan_assertions:",
		...(proof.quickPlanAssertions.length ? proof.quickPlanAssertions.map((item: any) => `- ${item}`) : ["- none"]),
		"runtime_adapter_closure:",
		...(proof.runtimeAdapterClosure.length
			? proof.runtimeAdapterClosure.map((item: any) => `- ${item}`)
			: ["- none"]),
		"case_memory_lane_plan:",
		...(proof.caseMemoryLanePlan
			? caseMemoryLanePlanLines(proof.caseMemoryLanePlan).map((item: any) => `- ${item}`)
			: ["- none"]),
		"case_memory_bridge:",
		...(proof.caseMemoryBridge.length ? proof.caseMemoryBridge.map((item: any) => `- ${item}`) : ["- none"]),
		"failure_signature_priority:",
		...(proof.failureSignaturePriority.length
			? proof.failureSignaturePriority.map((item: any) => `- ${item}`)
			: ["- none"]),
		"failure_signature_repair_queue:",
		...(proof.failureSignatureRepairQueue.length
			? proof.failureSignatureRepairQueue.map((item: any) => `- ${item}`)
			: ["- none"]),
		"compact_resume_telemetry:",
		...(proof.compactResumeTelemetry.length
			? proof.compactResumeTelemetry.map((item: any) => `- ${item}`)
			: ["- none"]),
		"compact_resume_queue:",
		...(proof.compactResumeQueue.length ? proof.compactResumeQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_feedback:",
		...(proof.operatorFeedback.length ? proof.operatorFeedback.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_feedback_queue:",
		...(proof.operatorFeedbackQueue.length
			? proof.operatorFeedbackQueue.map((item: any) => `- ${item}`)
			: ["- none"]),
		"swarm_retry_queue:",
		...(proof.swarmRetryQueue.length ? proof.swarmRetryQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"specialist_queue:",
		...(proof.specialistQueue.length ? proof.specialistQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"swarm_bridge:",
		...(proof.swarmBridge.length ? proof.swarmBridge.map((item: any) => `- ${item}`) : ["- none"]),
		"autonomous_execution_budget:",
		...autonomousBudgetLines(proof.autonomousBudget).map((item: any) => `- ${item}`),
		"dispatcher_score_decay:",
		...(proof.dispatcherScoreDecay?.length ? proof.dispatcherScoreDecay.map((item: any) => `- ${item}`) : ["- none"]),
		"repeated_failure_demotions:",
		...(proof.repeatedFailureDemotions?.length
			? proof.repeatedFailureDemotions.map((item: any) => `- ${item}`)
			: ["- none"]),
		"high_score_promotions:",
		...(proof.highScorePromotions?.length ? proof.highScorePromotions.map((item: any) => `- ${item}`) : ["- none"]),
		"bridge_artifacts:",
		...(proof.bridgeArtifacts.length ? proof.bridgeArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
		"steps:",
		...(proof.steps.length
			? proof.steps.map(
					(step: any) => `- ${step.id} [${step.status}] ${step.command}${step.reason ? ` # ${step.reason}` : ""}`,
				)
			: ["- none"]),
		`executed_steps: ${proof.executed.length}`,
		...(proof.executed.length
			? proof.executed.map(
					(item: any) =>
						`- ${item.stepId} [${item.status}] ${item.command} :: ${truncateMiddle(item.output.replace(/\s+/g, " "), 260)}`,
				)
			: []),
		"source_artifacts:",
		...(proof.sourceArtifacts.length ? proof.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	].filter(Boolean) as string[];
}
