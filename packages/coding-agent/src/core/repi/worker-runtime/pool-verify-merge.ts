/** Merge/claim ledger verification for worker runtime pool. */

import { sameStringSet } from "./helpers.ts";
import { claimAwareWorkerMergeProtocol } from "./pool-contract.ts";
import type { RepiWorkerRuntimePoolV1 } from "./types.ts";

export function collectWorkerRuntimePoolMergeErrors(
	pool: RepiWorkerRuntimePoolV1,
	runtimeIntervals: Array<{ workerId: string; start: number; end: number; resourceLease: any }>,
	maxConcurrency: number,
	activePoints: Array<{ t: number; delta: number }>,
): string[] {
	const errors: string[] = [];
	let active = 0;
	for (const point of activePoints.sort((left: any, right: any) => left.t - right.t || left.delta - right.delta)) {
		active += point.delta;
		if (active > maxConcurrency) errors.push(`maxConcurrency_exceeded:${active}>${maxConcurrency}`);
	}
	for (const t of Array.from(new Set(runtimeIntervals.map((interval: any) => interval.start))).sort(
		(a: any, b: any) => a - b,
	)) {
		const activeAtTime = runtimeIntervals.filter((interval: any) => interval.start <= t && t < interval.end);
		const cpuSlots = activeAtTime.reduce((sum: any, interval: any) => sum + interval.resourceLease.cpuSlots, 0);
		const memoryMb = activeAtTime.reduce((sum: any, interval: any) => sum + interval.resourceLease.memoryMb, 0);
		const maxProcesses = activeAtTime.reduce(
			(sum: any, interval: any) => sum + interval.resourceLease.maxProcesses,
			0,
		);
		if (cpuSlots > pool.resourceBudget.cpuSlots)
			errors.push(`resource_cpu_active_exceeds_budget:${cpuSlots}>${pool.resourceBudget.cpuSlots}`);
		if (memoryMb > pool.resourceBudget.memoryMb)
			errors.push(`resource_memory_active_exceeds_budget:${memoryMb}>${pool.resourceBudget.memoryMb}`);
		if (maxProcesses > pool.resourceBudget.maxProcesses)
			errors.push(`resource_process_active_exceeds_budget:${maxProcesses}>${pool.resourceBudget.maxProcesses}`);
	}
	for (const group of pool.parallelGroups) {
		const groupWorkerIds = new Set(group.workers);
		const groupIntervals = runtimeIntervals.filter((interval: any) => groupWorkerIds.has(interval.workerId));
		const groupLimit = Math.max(1, Math.floor(group.maxConcurrency));
		for (const t of Array.from(new Set(groupIntervals.map((interval: any) => interval.start))).sort(
			(a: any, b: any) => a - b,
		)) {
			const groupActive = groupIntervals.filter((interval: any) => interval.start <= t && t < interval.end).length;
			if (groupActive > groupLimit)
				errors.push(`parallelGroup_maxConcurrency_exceeded:${group.groupId}:${groupActive}>${groupLimit}`);
		}
	}
	if (claimAwareWorkerMergeProtocol(pool).some((row: any) => row.includes("unresolved")))
		errors.push("duplicate_mergeKey_unresolved");
	const mergeKeyWorkers = new Map<string, string[]>();
	for (const worker of pool.workers) {
		for (const key of Array.isArray(worker.mergeKey) ? worker.mergeKey : [worker.mergeKey]) {
			const rows = mergeKeyWorkers.get(key) ?? [];
			rows.push(worker.workerId);
			mergeKeyWorkers.set(key, rows);
		}
	}
	for (const [mergeKey, workers] of mergeKeyWorkers) {
		if (workers.length <= 1) continue;
		const conflicts = pool.mergeProtocol.conflicts.filter((conflict: any) => conflict.mergeKey === mergeKey);
		const resolvedConflicts = conflicts.filter((conflict: any) => conflict.status === "resolved");
		if (resolvedConflicts.length > 1) errors.push(`merge_conflict_multiple_resolutions:${mergeKey}`);
		for (const conflict of resolvedConflicts) {
			if (!sameStringSet(conflict.workers, workers)) errors.push(`merge_conflict_workers_mismatch:${mergeKey}`);
			if (!conflict.winner || !workers.includes(conflict.winner))
				errors.push(`merge_conflict_winner_invalid:${mergeKey}`);
			if (!conflict.evidenceRefs.length) errors.push(`merge_conflict_evidence_missing:${mergeKey}`);
			if (!conflict.resolutionReason?.trim()) errors.push(`merge_conflict_resolution_reason_missing:${mergeKey}`);
		}
	}
	for (const conflict of pool.mergeProtocol.conflicts) {
		const collidingWorkers = mergeKeyWorkers.get(conflict.mergeKey) ?? [];
		if (collidingWorkers.length < 2) errors.push(`merge_conflict_without_collision:${conflict.mergeKey}`);
	}
	const eventTypes = new Map<string, Set<string>>();
	for (const event of pool.claimLedgerEvents) {
		const id = event.claimId ?? event.claimIds?.[0];
		if (!id) continue;
		const types = eventTypes.get(id) ?? new Set<string>();
		types.add(event.type);
		eventTypes.set(id, types);
	}
	for (const claimId of pool.workers.flatMap((worker: any) => worker.claimRefs)) {
		const types = eventTypes.get(claimId);
		for (const required of ["artifact_handoff", "claim", "validation", "challenge", "resolution"]) {
			if (!types?.has(required)) errors.push(`claim_without_${required}:${claimId}`);
		}
	}
	return errors;
}
