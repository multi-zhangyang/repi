/**
 * Worker lease scheduler verification.
 */

import { createHash } from "node:crypto";
import { uniqueNonEmpty } from "../text.ts";
import { stableJson } from "./helpers.ts";
import type { RepiWorkerLeaseSchedulerEventV1, RepiWorkerLeaseSchedulerV1 } from "./types.ts";

export function workerLeaseSchedulerEventHash(event: Omit<RepiWorkerLeaseSchedulerEventV1, "eventHash">): string {
	return createHash("sha256").update(stableJson(event)).digest("hex");
}

export function verifyWorkerLeaseSchedulerV1(scheduler: RepiWorkerLeaseSchedulerV1): { ok: boolean; errors: string[] } {
	const errors: string[] = [];
	if (scheduler.kind !== "WorkerLeaseSchedulerV1") errors.push("worker_lease_scheduler_kind_invalid");
	if (scheduler.maxConcurrency < 1) errors.push("worker_lease_scheduler_max_concurrency_invalid");
	const activeLeases = new Map<string, string>();
	for (const task of scheduler.tasks) {
		if (task.status === "leased" || task.status === "running") {
			const existing = activeLeases.get(task.taskId);
			if (existing && existing !== task.leaseId)
				errors.push(`worker_lease_scheduler_duplicate_active_lease:${task.taskId}`);
			if (task.leaseId) activeLeases.set(task.taskId, task.leaseId);
		}
		if (task.attempt > task.maxAttempts) errors.push(`worker_lease_scheduler_attempt_exceeded:${task.taskId}`);
		if (!task.claimRefs.length) errors.push(`worker_lease_scheduler_claim_refs_missing:${task.taskId}`);
	}
	let prevHash = "0".repeat(64);
	const completed = new Set<string>();
	for (const event of scheduler.events) {
		if (event.kind !== "WorkerLeaseSchedulerEventV1")
			errors.push(`worker_lease_scheduler_event_kind_invalid:${event.eventId}`);
		if (event.prevHash !== prevHash) errors.push(`worker_lease_scheduler_prev_hash_mismatch:${event.eventId}`);
		const { eventHash: _eventHash, ...withoutHash } = event;
		if (event.eventHash !== workerLeaseSchedulerEventHash(withoutHash))
			errors.push(`worker_lease_scheduler_event_hash_mismatch:${event.eventId}`);
		prevHash = event.eventHash;
		if (event.type === "completed") {
			if (completed.has(event.taskId)) errors.push(`worker_lease_scheduler_duplicate_completion:${event.taskId}`);
			completed.add(event.taskId);
		}
	}
	if (!scheduler.assertions.leaseExclusive) errors.push("worker_lease_scheduler_lease_exclusive_missing");
	if (!scheduler.assertions.heartbeatRequired) errors.push("worker_lease_scheduler_heartbeat_missing");
	if (!scheduler.assertions.staleLeaseRecovered) errors.push("worker_lease_scheduler_stale_recovery_missing");
	if (!scheduler.assertions.workStealingObserved) errors.push("worker_lease_scheduler_work_steal_missing");
	if (!scheduler.assertions.duplicateCompletionRejected)
		errors.push("worker_lease_scheduler_duplicate_completion_rejection_missing");
	if (!scheduler.assertions.maxConcurrencyRespected)
		errors.push("worker_lease_scheduler_max_concurrency_not_respected");
	if (!scheduler.assertions.claimRefsPreserved) errors.push("worker_lease_scheduler_claim_refs_not_preserved");
	if (!scheduler.assertions.appendOnlyHashChain) errors.push("worker_lease_scheduler_hash_chain_not_append_only");
	return { ok: errors.length === 0, errors: uniqueNonEmpty(errors, 100) };
}
