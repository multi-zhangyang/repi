/** Supervisor claim policy + merge queue with reverse proof gates. */

import { parseSwarmArtifact } from "../graph-artifacts.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { ReconParallelPlanV1, SupervisorWorkerReview } from "../runtime-types.ts";
import { swarmPlanCoverage } from "../swarm-runtime/build/plan.ts";
import { latestSwarmArtifactPath, latestSwarmRunArtifactPath } from "../swarm-runtime/paths.ts";

export function supervisorClaimCheckPolicy(plan?: ReconParallelPlanV1, planCoverage: string[] = []): string[] {
	const reverseBlocked =
		/pending_runtime_capture|bind_ready\s*=\s*false|reverse_proof_exit_missing|require_proof_exit_before_claim|proof_exit\s*=\s*pending/i.test(
			JSON.stringify({ plan: plan ?? null, planCoverage }),
		);

	const workerBinding =
		planCoverage.find((row: any) => row.startsWith("worker_binding="))?.replace(/^worker_binding=/, "") ?? "missing";
	const missingContractRows = planCoverage.filter((row: any) => /\bmissing=[1-9]/.test(row));
	if (
		reverseBlocked ||
		planCoverage.some((row: any) =>
			/pending_runtime_capture|bind_ready=false|reverse_proof_exit_missing|proof_exit=pending/i.test(row),
		)
	) {
		const blob = JSON.stringify({ plan: plan ?? null, planCoverage });
		const next = reverseDomainCaptureNextCommands({
			routeOrBlob: blob,
			target: (plan as any)?.target,
		});
		return [
			"claim_check_policy.reverse_claim_blocked=true",
			"claim_check_policy.reverse_requires_runtime_proof_exit=true",
			...next.map((cmd: any) => `claim_check_policy.next=${cmd}`),
		];
	}
	return [
		`claim_check_policy.parallel_plan_id=${plan?.planId ?? "missing"}`,
		`claim_check_policy.parallel_plan_source=${plan?.source ?? "missing"}`,
		`claim_check_policy.worker_binding=${workerBinding}`,
		`claim_check_policy.plan_contract_gaps=${missingContractRows.length}`,
		"claim_check_policy.proven_requires_artifact_sha256=true",
		"claim_check_policy.proven_requires_json_query=true",
		"claim_check_policy.final_pass_requires_verifier=true",
		"claim_check_policy.unresolved_challenge_blocks=true",
		"claim_check_policy.orchestration_score_never_implies_platform_success=true",
		"claim_check_policy.final_pass_blocks_on_plan_coverage_gap=true",
		"claim_check_policy.reverse_technique_requires_proof_exit=true",
		"claim_check_policy.reverse_missing_proof_exit_blocks=true",
	];
}

export function swarmCommanderMergeQueue(swarm?: any): string[] {
	if (!swarm) return [];
	const target = swarm.target ?? "<target>";
	return Array.from(
		new Set([
			...(swarm.blocked.length ? [`re_supervisor repair ${target}`, `re_context pack ${target}`] : []),
			...swarm.retryQueue
				.flatMap((item: any) => item.match(/next=([^&;]+)/i)?.[1]?.trim() ?? [])
				.filter((item: any) => /^re[-_]/i.test(item)),
			...swarm.blocked.slice(0, 8).map(() => `re_swarm run ${target} 1 1`),
			...(swarm.workerResults.length
				? [
						"re_verifier matrix",
						`re_proof_loop run ${target} 4 2`,
						"re_domain_proof_exit show",
						"re_complete audit",
					]
				: []),
			...(swarm.mergeDigest.length ? ["re_swarm merge", "re_supervisor review"] : []),
			...(swarm.executions.length ? [`re_context pack ${target}`, `re_operator dispatch ${target} 2`] : []),
		]),
	).slice(0, 18);
}

export function commanderWorkerScoreboard(reviews: SupervisorWorkerReview[]): string[] {
	return reviews
		.slice()
		.sort((left: any, right: any) => left.priority - right.priority || left.score - right.score)
		.map((review: any) => {
			const retryBudget = review.verdict === "blocked" ? 2 : review.verdict === "repair" ? 1 : 0;
			const failureCost = review.verdict === "blocked" ? 2 : review.verdict === "repair" ? 1 : 0;
			const next = review.repairActions[0] ?? "none";
			return `${review.worker} packet=${review.packetId} verdict=${review.verdict} score=${review.score} retry_budget=${retryBudget} failure_cost=${failureCost} next=${next}`;
		})
		.slice(0, 32);
}

export function latestSwarmForSupervisor(options: { target?: string } = {}): { swarm: any; path: string } | undefined {
	const scope = options.target ? { target: options.target, requestedBy: "supervisor_swarm_run" } : {};
	const path = latestSwarmRunArtifactPath(scope) ?? latestSwarmArtifactPath(scope);
	if (!path) return undefined;
	const swarm = parseSwarmArtifact(path);
	if (!swarm) return undefined;
	if (options.target && swarm.target && options.target !== swarm.target) return undefined;
	return { swarm, path };
}

export function supervisorPlanCoverage(swarm?: any): string[] {
	if (!swarm) return ["parallel_plan=missing status=blocked next=re_swarm plan"];
	return swarmPlanCoverage(swarm);
}
