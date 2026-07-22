/** Worker retry handoff closure state/next-action. */

import type { RepiWorkerRetryHandoffClosureRowV1, RepiWorkerRetryHandoffClosureWorkerV1 } from "../types.ts";

export function workerRetryHandoffClosureState(
	worker: RepiWorkerRetryHandoffClosureWorkerV1,
): RepiWorkerRetryHandoffClosureRowV1["closure"] {
	if (worker.retryState === "retry_queued") return "retry_queued";
	if (worker.retryState === "handoff_recovered") return "handoff_recovered";
	if (worker.retryState === "exhausted_escalated") return "exhausted_escalated";
	if (worker.retryState === "blocked_without_closure") return "unresolved";
	return worker.status === "failed" || worker.status === "timeout" || worker.status === "cancelled"
		? "unresolved"
		: "passed";
}

/** reverse-heavy unresolved/exhausted paths include domain proof exit + runtime adapter capture */
export function workerRetryHandoffClosureNextAction(row: {
	workerId: string;
	closure: RepiWorkerRetryHandoffClosureRowV1["closure"];
}): string {
	switch (row.closure) {
		case "retry_queued":
			return `re_swarm retry worker=${row.workerId}`;
		case "handoff_recovered":
			return `re_swarm merge worker=${row.workerId} && re_supervisor review`;
		case "exhausted_escalated":
			return `re_domain_proof_exit show && re_complete audit && re_autofix plan worker=${row.workerId} && re_supervisor repair`;
		case "unresolved":
			return `re_domain_proof_exit show && re_runtime_adapter run && re_supervisor repair worker=${row.workerId}`;
		default:
			return `re_swarm merge worker=${row.workerId}`;
	}
}
