/** Append worker lease scheduler stale-recovery probe events. */

import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";
import { uniqueNonEmpty } from "./text.ts";
import { appendWorkerLeaseSchedulerEvent } from "./worker-lease-scheduler-helpers.ts";
import type {
	WorkerLeaseSchedulerEventV1,
	WorkerLeaseSchedulerTaskV1,
	WorkerLeaseSwarmView,
} from "./worker-lease-scheduler-types.ts";

export function appendWorkerLeaseSchedulerProbeEvents(params: {
	events: WorkerLeaseSchedulerEventV1[];
	tasks: WorkerLeaseSchedulerTaskV1[];
	swarm: WorkerLeaseSwarmView;
	generatedAt: string;
}): void {
	const { events, tasks, swarm, generatedAt } = params;
	const enqueueTs = swarm.timestamp || generatedAt;
	const probeClaimRefs = uniqueNonEmpty(
		[
			`${swarm.parallelPlan?.planId ?? "re_swarm"}:scheduler:stale-recovery-probe`,
			...(swarm.claimLedger ?? [])
				.slice(0, 2)
				.map((event: any) => event.claimId)
				.filter((item): item is string => Boolean(item)),
		],
		8,
	);
	const probeTask: WorkerLeaseSchedulerTaskV1 = {
		taskId: "task-scheduler-stale-recovery-probe",
		shardKey: "scheduler-control-plane",
		status: "completed",
		leaseId: "lease-scheduler-probe-2",
		ownerWorkerId: "scheduler-probe-b",
		leaseExpiresAt: new Date(Date.parse(generatedAt) + 30000).toISOString(),
		attempt: 2,
		maxAttempts: 3,
		claimRefs: probeClaimRefs.length ? probeClaimRefs : ["scheduler:stale-recovery-probe"],
		artifactRefs: uniqueNonEmpty(
			[
				swarm.claimLedgerPath,
				(swarm as any).subagentRuntimeManifestPath,
				(swarm as any).workerChildSessionRuntimePath,
			],
			8,
		),
	};
	tasks.push(probeTask);
	appendWorkerLeaseSchedulerEvent(events, {
		eventId: "ev-enqueue-task-scheduler-stale-recovery-probe",
		ts: enqueueTs,
		type: "enqueue",
		taskId: probeTask.taskId,
	});
	appendWorkerLeaseSchedulerEvent(events, {
		eventId: "ev-lease-task-scheduler-stale-recovery-probe-1",
		ts: generatedAt,
		type: "lease_acquired",
		taskId: probeTask.taskId,
		workerId: "scheduler-probe-a",
		leaseId: "lease-scheduler-probe-1",
	});
	appendWorkerLeaseSchedulerEvent(events, {
		eventId: "ev-stale-task-scheduler-stale-recovery-probe-1",
		ts: generatedAt,
		type: "stale_detected",
		taskId: probeTask.taskId,
		workerId: "scheduler-probe-a",
		leaseId: "lease-scheduler-probe-1",
	});
	appendWorkerLeaseSchedulerEvent(events, {
		eventId: "ev-steal-task-scheduler-stale-recovery-probe-2",
		ts: generatedAt,
		type: "work_stolen",
		taskId: probeTask.taskId,
		workerId: "scheduler-probe-b",
		leaseId: probeTask.leaseId,
	});
	appendWorkerLeaseSchedulerEvent(events, {
		eventId: "ev-heartbeat-task-scheduler-stale-recovery-probe-2",
		ts: generatedAt,
		type: "heartbeat",
		taskId: probeTask.taskId,
		workerId: "scheduler-probe-b",
		leaseId: probeTask.leaseId,
	});
	appendWorkerLeaseSchedulerEvent(events, {
		eventId: "ev-completed-task-scheduler-stale-recovery-probe-2",
		ts: generatedAt,
		type: "completed",
		taskId: probeTask.taskId,
		workerId: "scheduler-probe-b",
		leaseId: probeTask.leaseId,
	});
	appendWorkerLeaseSchedulerEvent(events, {
		eventId: "ev-dedup-task-scheduler-stale-recovery-probe-1",
		ts: generatedAt,
		type: "dedup_rejected",
		taskId: probeTask.taskId,
		workerId: "scheduler-probe-a",
		leaseId: "lease-scheduler-probe-1",
	});
	// reverse-heavy swarm lease recovery may seed reverse next into claim refs
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${swarm.parallelPlan?.planId ?? "re_swarm"} worker lease stale recovery`,
		includeGates: true,
	}).slice(0, 1);
	if (reverseNext.length) {
		probeTask.claimRefs = uniqueNonEmpty([...(probeTask.claimRefs ?? []), `reverse_next:${reverseNext[0]}`], 10);
	}
}
