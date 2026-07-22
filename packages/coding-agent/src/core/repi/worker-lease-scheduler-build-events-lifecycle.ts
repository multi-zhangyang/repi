import { appendWorkerLeaseSchedulerEvent } from "./worker-lease-scheduler-helpers.ts";
import type {
	WorkerLeaseSchedulerEventV1,
	WorkerLeaseSchedulerTaskV1,
	WorkerLeaseSwarmView,
} from "./worker-lease-scheduler-types.ts";

export function appendWorkerLeaseSchedulerLifecycleEvents(params: {
	events: WorkerLeaseSchedulerEventV1[];
	tasks: WorkerLeaseSchedulerTaskV1[];
	swarm: WorkerLeaseSwarmView;
	generatedAt: string;
	manifestsByWorker: Map<string, any>;
}): void {
	const { events, tasks, swarm, generatedAt, manifestsByWorker } = params;
	const enqueueTs = swarm.timestamp || generatedAt;
	for (const task of tasks) {
		appendWorkerLeaseSchedulerEvent(events, {
			eventId: `ev-enqueue-${task.taskId}`,
			ts: enqueueTs,
			type: "enqueue",
			taskId: task.taskId,
		});
	}
	for (const task of tasks) {
		const workerId = task.ownerWorkerId;
		if (!workerId || !task.leaseId) continue;
		const row = manifestsByWorker.get(workerId);
		appendWorkerLeaseSchedulerEvent(events, {
			eventId: `ev-lease-${task.taskId}-${task.attempt || 1}`,
			ts: row?.startedAt ?? generatedAt,
			type: "lease_acquired",
			taskId: task.taskId,
			workerId,
			leaseId: task.leaseId,
		});
		appendWorkerLeaseSchedulerEvent(events, {
			eventId: `ev-heartbeat-${task.taskId}-${task.attempt || 1}`,
			ts: row?.endedAt ?? generatedAt,
			type: "heartbeat",
			taskId: task.taskId,
			workerId,
			leaseId: task.leaseId,
		});
		if (task.status === "completed") {
			appendWorkerLeaseSchedulerEvent(events, {
				eventId: `ev-completed-${task.taskId}-${task.attempt || 1}`,
				ts: row?.endedAt ?? generatedAt,
				type: "completed",
				taskId: task.taskId,
				workerId,
				leaseId: task.leaseId,
			});
		} else if (task.status === "failed") {
			appendWorkerLeaseSchedulerEvent(events, {
				eventId: `ev-failed-${task.taskId}-${task.attempt || 1}`,
				ts: row?.endedAt ?? generatedAt,
				type: "failed",
				taskId: task.taskId,
				workerId,
				leaseId: task.leaseId,
			});
		}
	}
}
