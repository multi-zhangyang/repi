/** Per-worker retry handoff closure checks. */
import type { RepiWorkerRetryHandoffClosureV1 } from "../types.ts";

export function collectWorkerRetryHandoffWorkerErrors(report: RepiWorkerRetryHandoffClosureV1): {
	errors: string[];
	expectedRecovered: Set<string>;
	expectedUnresolved: Set<string>;
	workerById: Map<string, any>;
} {
	const errors: string[] = [];
	const workerById = new Map(report.workers.map((worker: any) => [worker.workerId, worker]));
	const expectedRecovered = new Set<string>();
	const expectedUnresolved = new Set<string>();
	for (const worker of report.workers) {
		const closedByRetry = worker.retryQueueRefs.length > 0;
		const closedByHandoff = worker.handoffRefs.length > 0;
		const closedByRepair = worker.repairRefs.length > 0;
		const isPassing = worker.status === "done" || worker.status === "passed";
		const isFailure = ["failed", "timeout", "cancelled", "retry_queued", "exhausted", "blocked"].includes(
			worker.status,
		);
		if (worker.attempt > worker.maxAttempts) errors.push(`retry_handoff_attempt_exceeded:${worker.workerId}`);
		if (worker.retryRemaining !== Math.max(0, worker.maxAttempts - worker.attempt))
			errors.push(`retry_handoff_remaining_inconsistent:${worker.workerId}`);
		if (worker.timedOut && !worker.cancelledAt)
			errors.push(`retry_handoff_timeout_without_cancel:${worker.workerId}`);
		if (worker.status === "timeout" && !worker.cancelledAt)
			errors.push(`retry_handoff_timeout_status_without_cancel:${worker.workerId}`);
		if (isFailure && !closedByRetry && !closedByHandoff && !closedByRepair)
			errors.push(`retry_handoff_failed_without_closure:${worker.workerId}`);
		if (worker.status === "retry_queued" && worker.retryRemaining < 1)
			errors.push(`retry_handoff_retry_queued_without_budget:${worker.workerId}`);
		if (worker.status === "exhausted" && (worker.retryRemaining !== 0 || !closedByRepair))
			errors.push(`retry_handoff_exhausted_without_escalation:${worker.workerId}`);
		if (!isPassing && closedByHandoff && !worker.claimRefs.length)
			errors.push(`retry_handoff_handoff_without_claim:${worker.workerId}`);
		if (closedByHandoff && !worker.mergeKeys.some((key: any) => worker.claimRefs.includes(key)))
			errors.push(`retry_handoff_handoff_mergeKey_not_claim_bound:${worker.workerId}`);
		if (!worker.sourceArtifacts.length) errors.push(`retry_handoff_source_artifacts_missing:${worker.workerId}`);
		const sourceArtifactSet = new Set(worker.sourceArtifacts);
		for (const ref of [...worker.retryQueueRefs, ...worker.handoffRefs, ...worker.repairRefs]) {
			if (!sourceArtifactSet.has(ref)) errors.push(`retry_handoff_ref_not_preserved:${worker.workerId}:${ref}`);
		}
		if (!worker.assertions.attemptBounded)
			errors.push(`retry_handoff_assertion_attempt_unbounded:${worker.workerId}`);
		if (!worker.assertions.retryBudgetConsistent)
			errors.push(`retry_handoff_assertion_retry_budget_inconsistent:${worker.workerId}`);
		if (!worker.assertions.timeoutCancellationRecorded)
			errors.push(`retry_handoff_assertion_timeout_cancel_missing:${worker.workerId}`);
		if (!worker.assertions.failureHasRetryOrHandoff)
			errors.push(`retry_handoff_assertion_failure_unclosed:${worker.workerId}`);
		if (!worker.assertions.exhaustionEscalated)
			errors.push(`retry_handoff_assertion_exhaustion_not_escalated:${worker.workerId}`);
		if (!worker.assertions.handoffBoundToClaim)
			errors.push(`retry_handoff_assertion_handoff_unbound:${worker.workerId}`);
		if (!worker.assertions.sourceArtifactsPreserved)
			errors.push(`retry_handoff_assertion_artifacts_missing:${worker.workerId}`);
		if (worker.retryState === "blocked_without_closure")
			errors.push(`retry_handoff_worker_unclosed:${worker.workerId}`);
		if (worker.retryState === "retry_queued" || worker.retryState === "handoff_recovered")
			expectedRecovered.add(worker.workerId);
		if (worker.retryState === "blocked_without_closure") expectedUnresolved.add(worker.workerId);
	}
	return { errors, expectedRecovered, expectedUnresolved, workerById };
}
