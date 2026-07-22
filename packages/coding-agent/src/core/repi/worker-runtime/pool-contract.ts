/** Worker runtime pool evidence contract + claim-aware merge protocol. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import type { RepiWorkerRuntimePoolV1 } from "./types.ts";

export function workerRuntimePoolEvidenceContract(): string[] {
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: "worker_runtime_pool reverse claim merge",
		includeGates: true,
	}).slice(0, 2);
	return [
		"worker stdout/stderr sha256 must match captured artifacts",
		"timeout/cancel must be explicit when elapsedMs exceeds timeoutMs",
		"retryBudget signature/attempt/remaining/exhausted must be consistent",
		"failed or timed-out workers must close through retry queue, handoff recovery, or exhausted escalation",
		"handoff artifacts must be claim-bound before supervisor merge",
		"resourceLease must fit the pool resourceBudget and group maxConcurrency",
		"claim-aware merge must resolve duplicate mergeKey conflicts before supervisor promotion",
		"resolved merge conflicts must name the real colliding workers, a winning worker, evidence refs, and a resolution reason",
		"each promoted worker claim must have artifact_handoff → claim → validation → challenge → resolution",
		"reverse-heavy workers require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true before merge promotion",
		...reverseNext.map((cmd: any) => `reverse_next: ${cmd}`),
	];
}

export function claimAwareWorkerMergeProtocol(pool: RepiWorkerRuntimePoolV1): string[] {
	const resolved = new Set(
		pool.mergeProtocol.conflicts.filter((row: any) => row.status === "resolved").map((row: any) => row.mergeKey),
	);
	const collisions = new Map<string, string[]>();
	for (const worker of pool.workers) {
		for (const key of Array.isArray(worker.mergeKey) ? worker.mergeKey : [worker.mergeKey]) {
			const rows = collisions.get(key) ?? [];
			rows.push(worker.workerId);
			collisions.set(key, rows);
		}
	}
	return Array.from(collisions.entries()).flatMap(([mergeKey, workers]) => {
		if (workers.length <= 1) return [];
		if (resolved.has(mergeKey)) return [`mergeKey=${mergeKey} resolved workers=${workers.join(",")}`];
		return [`mergeKey=${mergeKey} unresolved workers=${workers.join(",")} -> supervisor block`];
	});
}
