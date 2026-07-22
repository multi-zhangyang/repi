/** Merge/collision/assertion checks for worker retry handoff closure. */
import type { RepiWorkerRetryHandoffClosureV1 } from "../types.ts";

export function collectWorkerRetryHandoffMergeErrors(
	report: RepiWorkerRetryHandoffClosureV1,
	workerById: Map<string, any>,
	expectedRecovered: Set<string>,
	expectedUnresolved: Set<string>,
): string[] {
	const errors: string[] = [];
	for (const workerId of report.merge.recoveredWorkers) {
		if (!workerById.has(workerId)) errors.push(`retry_handoff_recovered_worker_unknown:${workerId}`);
		if (!expectedRecovered.has(workerId)) errors.push(`retry_handoff_recovered_worker_invalid:${workerId}`);
	}
	for (const workerId of expectedRecovered) {
		if (!report.merge.recoveredWorkers.includes(workerId))
			errors.push(`retry_handoff_recovered_worker_missing:${workerId}`);
	}
	for (const workerId of report.merge.unresolvedWorkers) {
		if (!workerById.has(workerId)) errors.push(`retry_handoff_unresolved_worker_unknown:${workerId}`);
		if (!expectedUnresolved.has(workerId)) errors.push(`retry_handoff_unresolved_worker_invalid:${workerId}`);
	}
	for (const workerId of expectedUnresolved) {
		if (!report.merge.unresolvedWorkers.includes(workerId))
			errors.push(`retry_handoff_unresolved_worker_missing:${workerId}`);
	}
	for (const conflict of report.merge.collisions) {
		if (conflict.status !== "resolved") errors.push(`retry_handoff_merge_collision_unresolved:${conflict.mergeKey}`);
		if (conflict.status === "resolved" && (!conflict.winner || !conflict.evidenceRefs.length))
			errors.push(`retry_handoff_merge_resolution_unproven:${conflict.mergeKey}`);
		if (conflict.workers.length < 2) errors.push(`retry_handoff_merge_collision_worker_count:${conflict.mergeKey}`);
		for (const workerId of conflict.workers) {
			if (!workerById.has(workerId))
				errors.push(`retry_handoff_merge_collision_worker_unknown:${conflict.mergeKey}:${workerId}`);
		}
		if (conflict.winner && !conflict.workers.includes(conflict.winner))
			errors.push(`retry_handoff_merge_winner_not_in_collision:${conflict.mergeKey}`);
		const winner = conflict.winner ? workerById.get(conflict.winner) : undefined;
		if (winner && ![...winner.mergeKeys, ...winner.claimRefs].includes(conflict.mergeKey))
			errors.push(`retry_handoff_merge_winner_not_bound_to_key:${conflict.mergeKey}`);
		if (conflict.status === "resolved" && !conflict.resolutionReason?.trim())
			errors.push(`retry_handoff_merge_resolution_reason_missing:${conflict.mergeKey}`);
		const collidingEvidence = new Set<string>();
		for (const workerId of conflict.workers) {
			const worker = workerById.get(workerId);
			if (!worker) continue;
			for (const ref of [
				...worker.sourceArtifacts,
				...worker.retryQueueRefs,
				...worker.handoffRefs,
				...worker.repairRefs,
				...worker.claimRefs,
				...worker.mergeKeys,
			]) {
				collidingEvidence.add(ref);
			}
		}
		if (conflict.evidenceRefs.length && !conflict.evidenceRefs.some((ref: any) => collidingEvidence.has(ref)))
			errors.push(`retry_handoff_merge_evidence_unbound:${conflict.mergeKey}`);
	}
	if (!report.assertions.retryAttemptsBounded) errors.push("retry_handoff_attempts_not_bounded");
	if (!report.assertions.retryBudgetsConsistent) errors.push("retry_handoff_budgets_inconsistent");
	if (!report.assertions.timeoutCancellationRecorded) errors.push("retry_handoff_timeout_cancel_not_recorded");
	if (!report.assertions.failedWorkersHaveRetryOrHandoff) errors.push("retry_handoff_failures_not_closed");
	if (!report.assertions.exhaustedWorkersEscalated) errors.push("retry_handoff_exhausted_not_escalated");
	if (!report.assertions.handoffRefsBoundToClaims) errors.push("retry_handoff_refs_not_claim_bound");
	if (!report.assertions.mergeCollisionsResolved) errors.push("retry_handoff_merge_collisions_unresolved");
	if (!report.assertions.claimRefsPreserved) errors.push("retry_handoff_claim_refs_missing");
	if (!report.assertions.sourceArtifactsPreserved) errors.push("retry_handoff_source_artifacts_missing");
	if (report.errors.length) errors.push(...report.errors.map((error: any) => `retry_handoff_report_error:${error}`));
	return errors;
}
