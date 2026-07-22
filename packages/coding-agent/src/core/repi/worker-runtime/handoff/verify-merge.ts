/** Verify worker retry handoff merge summary. */

import { uniqueNonEmpty } from "../../text.ts";
import type { RepiWorkerRetryHandoffMergeSummaryV1 } from "../types.ts";
import { workerRetryHandoffMergeSummaryEvidenceContract } from "./contract.ts";

export function verifyWorkerRetryHandoffMergeSummaryV1(summary: RepiWorkerRetryHandoffMergeSummaryV1): {
	ok: boolean;
	errors: string[];
	evidenceContract: string[];
} {
	const errors: string[] = [];
	if (summary.kind !== "WorkerRetryHandoffMergeSummaryV1") errors.push("retry_handoff_merge_summary_kind_invalid");
	if (summary.schemaVersion !== 1) errors.push("retry_handoff_merge_summary_schema_version_invalid");
	if (!summary.closureId) errors.push("retry_handoff_merge_summary_closure_missing");
	if (!summary.poolId) errors.push("retry_handoff_merge_summary_pool_missing");
	if (!summary.nextActions.length) errors.push("retry_handoff_merge_summary_next_actions_missing");
	if (!summary.sourceArtifacts.length) errors.push("retry_handoff_merge_summary_source_artifacts_missing");
	if (!summary.workerClosures?.length) errors.push("retry_handoff_merge_summary_worker_closures_missing");
	const workerClosureIds = new Set<string>();
	const sourceArtifactSet = new Set(summary.sourceArtifacts);
	for (const row of summary.workerClosures ?? []) {
		if (!row.workerId) errors.push("retry_handoff_merge_summary_worker_closure_id_missing");
		if (workerClosureIds.has(row.workerId))
			errors.push(`retry_handoff_merge_summary_worker_closure_duplicate:${row.workerId}`);
		workerClosureIds.add(row.workerId);
		if (row.attempt > row.maxAttempts)
			errors.push(`retry_handoff_merge_summary_worker_closure_attempt_exceeded:${row.workerId}`);
		if (row.retryRemaining !== Math.max(0, row.maxAttempts - row.attempt))
			errors.push(`retry_handoff_merge_summary_worker_closure_budget_inconsistent:${row.workerId}`);
		if (row.timedOut && !row.cancelledAt)
			errors.push(`retry_handoff_merge_summary_timeout_without_cancel:${row.workerId}`);
		if (!row.evidenceRefs.length)
			errors.push(`retry_handoff_merge_summary_worker_closure_evidence_missing:${row.workerId}`);
		for (const ref of [...row.retryQueueRefs, ...row.handoffRefs, ...row.repairRefs]) {
			if (!row.evidenceRefs.includes(ref))
				errors.push(`retry_handoff_merge_summary_worker_closure_ref_unbound:${row.workerId}:${ref}`);
		}
		if (!row.evidenceRefs.every((ref: any) => sourceArtifactSet.has(ref)))
			errors.push(`retry_handoff_merge_summary_worker_closure_not_in_source_artifacts:${row.workerId}`);
		if (row.closure === "retry_queued" && !/re_swarm retry/.test(row.nextAction))
			errors.push(`retry_handoff_merge_summary_worker_closure_retry_action_missing:${row.workerId}`);
		if (row.closure === "handoff_recovered" && (!row.handoffRefs.length || !/re_swarm merge/.test(row.nextAction)))
			errors.push(`retry_handoff_merge_summary_worker_closure_handoff_action_missing:${row.workerId}`);
		if (
			row.closure === "exhausted_escalated" &&
			(!row.repairRefs.length || !/re_autofix|re_supervisor/.test(row.nextAction))
		)
			errors.push(`retry_handoff_merge_summary_worker_closure_escalation_action_missing:${row.workerId}`);
		if (row.closure === "unresolved" && !/re_supervisor repair/.test(row.nextAction))
			errors.push(`retry_handoff_merge_summary_worker_closure_unresolved_action_missing:${row.workerId}`);
		if (row.closure !== "passed" && !summary.nextActions.includes(row.nextAction))
			errors.push(`retry_handoff_merge_summary_worker_closure_next_action_missing:${row.workerId}`);
		if (!row.summary.includes(`worker=${row.workerId}`) || !row.summary.includes(`closure=${row.closure}`))
			errors.push(`retry_handoff_merge_summary_worker_closure_summary_incomplete:${row.workerId}`);
	}
	if (summary.unresolvedWorkers.length && summary.status === "pass")
		errors.push("retry_handoff_merge_summary_fake_pass_unresolved_workers");
	if (summary.unresolvedCollisions.length && summary.status === "pass")
		errors.push("retry_handoff_merge_summary_fake_pass_unresolved_collisions");
	if (!summary.assertions.noUnresolvedWorkers) errors.push("retry_handoff_merge_summary_unresolved_workers");
	if (!summary.assertions.collisionsResolved) errors.push("retry_handoff_merge_summary_collisions_unresolved");
	if (!summary.assertions.allFailuresClosed) errors.push("retry_handoff_merge_summary_failures_unclosed");
	if (!summary.assertions.handoffEvidenceBound) errors.push("retry_handoff_merge_summary_handoff_unbound");
	if (!summary.assertions.retryBudgetVisible) errors.push("retry_handoff_merge_summary_retry_budget_hidden");
	if (!summary.assertions.sourceArtifactsPreserved)
		errors.push("retry_handoff_merge_summary_source_artifacts_missing");
	if (summary.claimRefs.length && !summary.sourceArtifacts.length)
		errors.push("retry_handoff_merge_summary_claims_without_artifacts");
	for (const workerId of summary.retryQueuedWorkers) {
		if (!summary.nextActions.some((action: any) => action.includes(workerId) && /re_swarm retry/.test(action))) {
			errors.push(`retry_handoff_merge_summary_retry_action_missing:${workerId}`);
		}
	}
	for (const workerId of summary.exhaustedEscalatedWorkers) {
		if (
			!summary.nextActions.some(
				(action: any) => action.includes(workerId) && /re_autofix|re_supervisor/.test(action),
			)
		) {
			errors.push(`retry_handoff_merge_summary_escalation_action_missing:${workerId}`);
		}
	}
	for (const workerId of summary.unresolvedWorkers) {
		if (
			!summary.nextActions.some(
				(action) => action.includes(workerId) && /re_supervisor repair|re_swarm retry/.test(action),
			)
		) {
			errors.push(`retry_handoff_merge_summary_unresolved_action_missing:${workerId}`);
		}
	}
	for (const mergeKey of summary.unresolvedCollisions) {
		if (!summary.nextActions.some((action: any) => action.includes(`mergeKey=${mergeKey}`))) {
			errors.push(`retry_handoff_merge_summary_collision_action_missing:${mergeKey}`);
		}
	}
	const allAssertionsPass = Object.values(summary.assertions).every(Boolean);
	const hasBlockers =
		!allAssertionsPass || summary.unresolvedWorkers.length > 0 || summary.unresolvedCollisions.length > 0;
	if (summary.status === "pass" && (summary.workerClosures ?? []).some((row: any) => row.closure === "unresolved"))
		errors.push("retry_handoff_merge_summary_fake_pass_unresolved_worker_closure");
	if (summary.status === "pass" && hasBlockers) errors.push("retry_handoff_merge_summary_pass_with_blockers");
	if (summary.status === "blocked" && !hasBlockers) errors.push("retry_handoff_merge_summary_blocked_without_blocker");
	if (summary.status === "pass" && !summary.nextActions.some((action: any) => action.includes("re_swarm merge")))
		errors.push("retry_handoff_merge_summary_pass_without_merge_action");
	return {
		ok: errors.length === 0,
		errors: uniqueNonEmpty(errors, 120),
		evidenceContract: workerRetryHandoffMergeSummaryEvidenceContract(),
	};
}
