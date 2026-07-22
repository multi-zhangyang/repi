/** Worker lease scheduler pure helpers. */
import { slug, uniqueNonEmpty } from "./text.ts";
import type {
	WorkerLeaseSchedulerEventV1,
	WorkerLeaseSchedulerTaskV1,
	WorkerLeaseSwarmView,
} from "./worker-lease-scheduler-types.ts";
import { workerLeaseSchedulerEventHash } from "./worker-runtime.ts";

export function appendWorkerLeaseSchedulerEvent(
	events: WorkerLeaseSchedulerEventV1[],
	event: Omit<WorkerLeaseSchedulerEventV1, "kind" | "schemaVersion" | "prevHash" | "eventHash">,
): WorkerLeaseSchedulerEventV1 {
	const row: WorkerLeaseSchedulerEventV1 = {
		kind: "WorkerLeaseSchedulerEventV1",
		schemaVersion: 1,
		...event,
		prevHash: events.at(-1)?.eventHash ?? "0".repeat(64),
		eventHash: "",
	};
	const { eventHash: _eventHash, ...withoutHash } = row;
	row.eventHash = workerLeaseSchedulerEventHash(withoutHash);
	events.push(row);
	return row;
}

export function workerLeaseSchedulerClaimRefs(swarm: WorkerLeaseSwarmView, workerId: string): string[] {
	return uniqueNonEmpty(
		[
			...(swarm.claimLedger ?? [])
				.filter((event: any) => event.workerId === workerId && event.claimId)
				.map((event: any) => event.claimId as string),
			`${swarm.parallelPlan?.planId ?? "re_swarm"}:worker:${slug(workerId).slice(0, 48)}`,
		],
		8,
	);
}

export function workerLeaseSchedulerTaskStatus(
	manifest?: NonNullable<WorkerLeaseSwarmView["subagentRuntimeManifests"]>[number],
): WorkerLeaseSchedulerTaskV1["status"] {
	if (!manifest) return "queued";
	if (manifest.status === "done") return "completed";
	if (manifest.status === "blocked" || manifest.status === "cancelled") return "failed";
	return "queued";
}
