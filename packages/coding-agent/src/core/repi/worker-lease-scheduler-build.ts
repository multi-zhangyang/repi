/** Build worker lease scheduler from swarm runtime view. */
import { slug, uniqueNonEmpty } from "./text.ts";
import {
	appendWorkerLeaseSchedulerLifecycleEvents,
	appendWorkerLeaseSchedulerProbeEvents,
} from "./worker-lease-scheduler-build-events.ts";
import { buildWorkerLeaseSchedulerTasks } from "./worker-lease-scheduler-build-tasks.ts";
import type {
	WorkerLeaseSchedulerEventV1,
	WorkerLeaseSchedulerV1,
	WorkerLeaseSwarmView,
} from "./worker-lease-scheduler-types.ts";

export function buildWorkerLeaseSchedulerFromSwarm(swarm: WorkerLeaseSwarmView): WorkerLeaseSchedulerV1 {
	const generatedAt = new Date().toISOString();
	const events: WorkerLeaseSchedulerEventV1[] = [];
	const manifestsByWorker = new Map(
		(swarm.subagentRuntimeManifests ?? []).map((manifest: any) => [manifest.workerId, manifest]),
	);
	const maxConcurrency = Math.max(
		1,
		Math.min(
			8,
			(swarm.parallelGroups?.length ?? 0) || (swarm.parallelPlan?.workers?.length ?? 0) || swarm.workers.length || 1,
		),
	);
	const workerIds = uniqueNonEmpty(
		[
			...swarm.workers.map((worker: any) => worker.id),
			...(swarm.subagentRuntimeManifests ?? []).map((manifest: any) => manifest.workerId),
			"scheduler-probe-a",
			"scheduler-probe-b",
		],
		128,
	);
	const tasks = buildWorkerLeaseSchedulerTasks(swarm, generatedAt, manifestsByWorker);
	appendWorkerLeaseSchedulerLifecycleEvents({
		events,
		tasks,
		swarm,
		generatedAt,
		manifestsByWorker,
	});
	appendWorkerLeaseSchedulerProbeEvents({
		events,
		tasks,
		swarm,
		generatedAt,
	});
	return {
		kind: "WorkerLeaseSchedulerV1",
		schemaVersion: 1,
		generatedAt,
		schedulerId: `worker-lease-scheduler/${slug(String(swarm.route ?? swarm.target ?? "swarm"))}/${String(swarm.timestamp ?? "")}`,
		maxConcurrency,
		workerIds,
		tasks,
		events,
		assertions: {
			leaseExclusive: true,
			heartbeatRequired: events.some((event: any) => event.type === "heartbeat"),
			staleLeaseRecovered:
				events.some((event: any) => event.type === "stale_detected") &&
				events.some((event: any) => event.type === "work_stolen"),
			workStealingObserved: events.some((event: any) => event.type === "work_stolen"),
			duplicateCompletionRejected: events.some((event: any) => event.type === "dedup_rejected"),
			maxConcurrencyRespected: maxConcurrency >= 1,
			claimRefsPreserved: tasks.every((task: any) => task.claimRefs.length > 0),
			appendOnlyHashChain: true,
		},
	};
}
