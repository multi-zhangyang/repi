/** Per-worker runtime pool verification checks. */
import type { RepiWorkerRuntimePoolV1, RepiWorkerRuntimePoolWorkerV1 } from "./types.ts";

export function collectWorkerRuntimePoolWorkerErrors(pool: RepiWorkerRuntimePoolV1): {
	errors: string[];
	runtimeIntervals: Array<{
		workerId: string;
		start: number;
		end: number;
		resourceLease: RepiWorkerRuntimePoolWorkerV1["resourceLease"];
	}>;
	activePoints: Array<{ t: number; delta: number }>;
} {
	const errors: string[] = [];
	const runtimeIntervals: Array<{
		workerId: string;
		start: number;
		end: number;
		resourceLease: RepiWorkerRuntimePoolWorkerV1["resourceLease"];
	}> = [];
	const activePoints = pool.workers.flatMap((worker: any) => {
		const start = worker.startedAt ? Date.parse(worker.startedAt) : Number.NaN;
		const end = worker.endedAt ? Date.parse(worker.endedAt) : Number.NaN;
		if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];
		runtimeIntervals.push({
			workerId: worker.workerId,
			start,
			end,
			resourceLease: worker.resourceLease,
		});
		if (end - start > worker.timeoutMs && worker.status !== "timeout" && worker.status !== "cancelled")
			errors.push(`timeout_not_marked:${worker.workerId}`);
		if (worker.status === "timeout" && pool.cancelOnTimeout && !worker.cancelledAt)
			errors.push(`timeout_without_cancel:${worker.workerId}`);
		if (worker.attempt > worker.maxAttempts) errors.push(`attempt_exceeds_maxAttempts:${worker.workerId}`);
		if (worker.retryBudget.remaining !== Math.max(0, worker.maxAttempts - worker.attempt))
			errors.push(`retryBudget_remaining_inconsistent:${worker.workerId}`);
		if (worker.retryBudget.exhausted !== worker.attempt >= worker.maxAttempts)
			errors.push(`retryBudget_exhausted_inconsistent:${worker.workerId}`);
		if (worker.status === "retry_queued" && worker.retryBudget.exhausted)
			errors.push(`exhausted_still_retrying:${worker.workerId}`);
		if (worker.resourceLease.cpuSlots > pool.resourceBudget.cpuSlots)
			errors.push(`resource_cpu_exceeds_budget:${worker.workerId}`);
		if (worker.resourceLease.memoryMb > pool.resourceBudget.memoryMb)
			errors.push(`resource_memory_exceeds_budget:${worker.workerId}`);
		if (worker.resourceLease.maxProcesses > pool.resourceBudget.maxProcesses)
			errors.push(`resource_process_exceeds_budget:${worker.workerId}`);
		return [
			{ t: start, delta: 1 },
			{ t: end, delta: -1 },
		];
	});
	return { errors, runtimeIntervals, activePoints };
}
