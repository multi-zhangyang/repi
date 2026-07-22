/** Supervisor formatting. */

import { formatStrictClaimCheckSnapshot } from "../compiler-runtime/pure-claim.ts";
import type { SupervisorArtifact } from "./types.ts";

export function formatSupervisor(supervisor: SupervisorArtifact, path?: string): string {
	return [
		"supervisor_review:",
		path ? `supervisor_artifact: ${path}` : undefined,
		`timestamp: ${supervisor.timestamp}`,
		`mode: ${supervisor.mode}`,
		`supervisor_verdict: ${supervisor.supervisorVerdict}`,
		`mission_id: ${supervisor.missionId ?? "none"}`,
		`route: ${supervisor.route ?? "none"}`,
		`target: ${supervisor.target ?? "<none>"}`,
		`delegation_artifact: ${supervisor.delegationArtifact ?? "none"}`,
		`swarm_artifact: ${supervisor.swarmArtifact ?? "none"}`,
		"worker_reviews:",
		...(supervisor.reviews.length
			? supervisor.reviews.flatMap((review: any) => [
					`- ${review.worker} [${review.verdict}] score=${review.score} priority=${review.priority} packet=${review.packetId}`,
					`  rationale: ${review.rationale.join(" | ")}`,
					`  conflicts: ${review.conflicts.length ? review.conflicts.join(" | ") : "none"}`,
					`  evidence_gaps: ${review.evidenceGaps.length ? review.evidenceGaps.join(" | ") : "none"}`,
					`  repair_actions: ${review.repairActions.length ? review.repairActions.join(" | ") : "none"}`,
				])
			: ["- none"]),
		"conflict_matrix:",
		...(supervisor.conflicts.length ? supervisor.conflicts.map((item: any) => `- ${item}`) : ["- none"]),
		"repair_queue:",
		...(supervisor.repairQueue.length ? supervisor.repairQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"commander_merge_queue:",
		...(supervisor.commanderMergeQueue.length
			? supervisor.commanderMergeQueue.map((item: any) => `- ${item}`)
			: ["- none"]),
		"commander_merge_budget:",
		...(supervisor.commanderMergeBudget.length
			? supervisor.commanderMergeBudget.map((item: any) => `- ${item}`)
			: ["- none"]),
		"worker_scoreboard:",
		...(supervisor.workerScoreboard.length
			? supervisor.workerScoreboard.map((item: any) => `- ${item}`)
			: ["- none"]),
		"priority_queue:",
		...(supervisor.priorityQueue.length ? supervisor.priorityQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"checkpoints:",
		...(supervisor.checkpoints.length ? supervisor.checkpoints.map((item: any) => `- ${item}`) : ["- none"]),
		"parallel_plan:",
		...(supervisor.parallelPlan
			? [
					`- plan_id=${supervisor.parallelPlan.planId}`,
					`- source=${supervisor.parallelPlan.source}`,
					`- workers=${supervisor.parallelPlan.workers.length}`,
					`- merge=${supervisor.parallelPlan.merge.strategy}`,
				]
			: ["- none"]),
		"plan_coverage:",
		...(supervisor.planCoverage.length ? supervisor.planCoverage.map((item: any) => `- ${item}`) : ["- none"]),
		"release_check_metadata:",
		...(supervisor.releaseCheckMetadata.length
			? supervisor.releaseCheckMetadata.map((item: any) => `- ${item}`)
			: ["- none"]),
		"claim_check_policy:",
		...(supervisor.claimCheckPolicy.length
			? supervisor.claimCheckPolicy.map((item: any) => `- ${item}`)
			: ["- none"]),
		"strict_claim_check:",
		...formatStrictClaimCheckSnapshot(supervisor.strictClaimCheck),
		"claim_check_result:",
		...(supervisor.claimCheckResult.length
			? supervisor.claimCheckResult.map((item: any) => `- ${item}`)
			: ["- none"]),
		"operator_next_actions:",
		...(supervisor.nextActions.length
			? supervisor.nextActions.map((item: any) => `- ${item}`)
			: ["- re_complete audit"]),
		`next_supervisor_command: ${supervisor.mode === "repair" ? "re_supervisor review" : "re_supervisor repair"}`,
		...(supervisor.llmCritique
			? ["llm_supervisor_critique:", ...supervisor.llmCritique.split("\n").map((line: any) => `- ${line}`)]
			: []),
		"source_artifacts:",
		...(supervisor.sourceArtifacts.length ? supervisor.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
