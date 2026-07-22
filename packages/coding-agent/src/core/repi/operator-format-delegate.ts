/** Format delegate artifact. */
/** Operator/delegate pure format helpers. */

import { autonomousBudgetLines } from "./operator-format-budget.ts";
import type { DelegateArtifact } from "./operator-format-types.ts";

export function formatDelegate(delegate: DelegateArtifact, path?: string): string {
	return [
		"delegation_plan:",
		path ? `delegation_artifact: ${path}` : undefined,
		`timestamp: ${delegate.timestamp}`,
		`mode: ${delegate.mode}`,
		`mission_id: ${delegate.missionId ?? "none"}`,
		`route: ${delegate.route ?? "none"}`,
		`target: ${delegate.target ?? "<none>"}`,
		`operation_artifact: ${delegate.operationArtifact ?? "none"}`,
		"worker_packets:",
		...(delegate.packets.length
			? delegate.packets.flatMap((packet: any) => [
					`- ${packet.id} [${packet.status}] worker=${packet.worker} phases=${packet.phases.join(",") || "none"} steps=${packet.steps.length}`,
					`  objective: ${packet.objective}`,
					`  evidence_contract: ${packet.evidenceContract.join(" | ")}`,
					`  recommended_tools: ${packet.recommendedTools.join(", ")}`,
					`  handoff: ${packet.handoffPrompt.join(" ; ")}`,
				])
			: ["- none"]),
		"merge_queue:",
		...(delegate.mergeQueue.length ? delegate.mergeQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"specialist_coverage:",
		...(delegate.specialistCoverage.length
			? delegate.specialistCoverage.map((item: any) => `- ${item}`)
			: ["- none"]),
		"worker_scoreboard:",
		...(delegate.workerScoreboard?.length ? delegate.workerScoreboard.map((item: any) => `- ${item}`) : ["- none"]),
		"adaptive_routing_hints:",
		...(delegate.adaptiveRoutingHints?.length
			? delegate.adaptiveRoutingHints.map((item: any) => `- ${item}`)
			: ["- none"]),
		"worker_promotion_queue:",
		...(delegate.workerPromotionQueue?.length
			? delegate.workerPromotionQueue.map((item: any) => `- ${item}`)
			: ["- none"]),
		"autonomous_execution_budget:",
		...autonomousBudgetLines(delegate.autonomousBudget).map((item: any) => `- ${item}`),
		"dispatcher_score_decay:",
		...(delegate.dispatcherScoreDecay?.length
			? delegate.dispatcherScoreDecay.map((item: any) => `- ${item}`)
			: ["- none"]),
		"repeated_failure_demotions:",
		...(delegate.repeatedFailureDemotions?.length
			? delegate.repeatedFailureDemotions.map((item: any) => `- ${item}`)
			: ["- none"]),
		"high_score_promotions:",
		...(delegate.highScorePromotions?.length
			? delegate.highScorePromotions.map((item: any) => `- ${item}`)
			: ["- none"]),
		"evidence_gaps:",
		...(delegate.gaps.length ? delegate.gaps.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_next_actions:",
		...(delegate.nextActions.length ? delegate.nextActions.map((item: any) => `- ${item}`) : ["- re_complete audit"]),
		`next_delegate_command: ${delegate.mode === "merge" ? "re_complete audit" : "re_delegate merge"}`,
		"source_artifacts:",
		...(delegate.sourceArtifacts.length ? delegate.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
