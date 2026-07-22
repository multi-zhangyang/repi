/** Swarm commander worker runtime review with reverse proof gates. */

import { applySwarmWorkerReverseReview, computeSwarmWorkerReverseSignals } from "./run-review-reverse.ts";
import { scoreSwarmWorkerRuntimeBase } from "./run-review-score.ts";

type SwarmWorkerRuntime = any;
type SupervisorVerdict = any;

export function reviewSwarmWorkerRuntime(worker: SwarmWorkerRuntime, swarm: any, ledger: string): any {
	const reverse = computeSwarmWorkerReverseSignals(worker, swarm);
	const base = scoreSwarmWorkerRuntimeBase(worker, swarm, ledger);
	const reviewed = applySwarmWorkerReverseReview(
		{
			score: base.score,
			rationale: base.rationale,
			evidenceGaps: base.evidenceGaps,
			repairActions: base.repairActions,
			...reverse,
		},
		swarm,
	);
	const score = Math.max(0, Math.min(100, reviewed.score));
	const verdict: SupervisorVerdict =
		worker.status === "blocked" ? "blocked" : score >= 80 ? "pass" : score >= 60 ? "watch" : "repair";
	const priority = verdict === "blocked" ? 1 : verdict === "repair" ? 2 : verdict === "watch" ? 3 : 4;
	return {
		reverseSignals: reviewed.reverseSignals,
		reverseProofBlocked: reviewed.reverseProofBlocked,
		reverseProofReady: reviewed.reverseProofReady,
		packetId: worker.id,
		worker: worker.worker,
		verdict,
		score,
		priority,
		rationale: reviewed.rationale.length ? reviewed.rationale : ["swarm worker requires commander merge follow-up"],
		conflicts: base.conflicts,
		evidenceGaps: reviewed.evidenceGaps,
		repairActions: Array.from(new Set(reviewed.repairActions)).slice(0, 10),
	};
}
