/** Supervisor merge budget + critique parse. */
/** Supervisor worker review, merge budget, and LLM critique. */

import type { SupervisorWorkerReview } from "../runtime-types.ts";
import type { SwarmArtifact } from "../swarm-runtime.ts";
import { truncateMiddle } from "../text.ts";

export function parseSupervisorCritique(mergeText: string): { verdict: string; text: string } {
	const verdictMatch = /supervisor_verdict:\s*([a-z_]+)/i.exec(mergeText);
	const verdict = verdictMatch?.[1]?.toLowerCase() ?? "inconclusive";
	const text = truncateMiddle(mergeText, 8000);
	return { verdict, text };
}

export function buildCommanderMergeBudget(
	reviews: SupervisorWorkerReview[],
	queue: string[],
	swarm?: SwarmArtifact,
): string[] {
	const blockedWorkers = reviews.filter((review: any) => review.verdict === "blocked").length;
	const repairWorkers = reviews.filter((review: any) => review.verdict === "repair").length;
	const watchWorkers = reviews.filter((review: any) => review.verdict === "watch").length;
	const queueDepth = queue.length;
	const maxDispatch = Math.max(1, Math.min(6, queueDepth ? Math.ceil(queueDepth / 2) : 1));
	const retryLimit = Math.max(1, Math.min(3, blockedWorkers ? 2 : repairWorkers ? 1 : 1));
	const failureBudget = Math.max(
		1,
		Math.min(6, blockedWorkers * 2 + repairWorkers + (swarm?.blocked.length ?? 0) || 1),
	);
	const proofRerun = queue.some((item: any) => /^re[-_]proof[-_]loop\s+run/i.test(item));
	return [
		`max_dispatch=${maxDispatch}`,
		`retry_limit_per_worker=${retryLimit}`,
		`failure_budget=${failureBudget}`,
		`queue_depth=${queueDepth}`,
		`blocked_workers=${blockedWorkers}`,
		`repair_workers=${repairWorkers}`,
		`watch_workers=${watchWorkers}`,
		`swarm_executions=${swarm?.executions.length ?? 0}`,
		`swarm_blocked=${swarm?.blocked.length ?? 0}`,
		`proof_rerun=${proofRerun ? "yes" : "no"}`,
		`reverse_proof_exit_queue=${queue.some((item: any) => /domain_proof_exit|proof_exit|re_complete audit/i.test(item)) ? "yes" : "no"}`,
	];
}
