/** Build worker lease scheduler tasks from swarm view. */
import { slug, uniqueNonEmpty } from "./text.ts";
import { workerLeaseSchedulerClaimRefs, workerLeaseSchedulerTaskStatus } from "./worker-lease-scheduler-helpers.ts";
import type { WorkerLeaseSchedulerTaskV1, WorkerLeaseSwarmView } from "./worker-lease-scheduler-types.ts";

export function buildWorkerLeaseSchedulerTasks(
	swarm: WorkerLeaseSwarmView,
	generatedAt: string,
	manifestsByWorker: Map<string, any>,
): WorkerLeaseSchedulerTaskV1[] {
	return swarm.workers.map((worker: any) => {
		const manifest = manifestsByWorker.get(worker.id);
		const leaseId = manifest ? `lease-${slug(worker.id)}-${manifest.attempt}` : undefined;
		return {
			taskId: `task-${slug(worker.id).slice(0, 80)}`,
			shardKey: worker.worker,
			status: workerLeaseSchedulerTaskStatus(manifest),
			...(leaseId
				? {
						leaseId,
						ownerWorkerId: worker.id,
						leaseExpiresAt: new Date(Date.parse(manifest?.endedAt ?? generatedAt) + 30000).toISOString(),
					}
				: {}),
			attempt: manifest?.attempt ?? 0,
			maxAttempts: manifest?.retryBudget?.maxAttempts ?? 3,
			claimRefs: workerLeaseSchedulerClaimRefs(swarm, worker.id),
			artifactRefs: uniqueNonEmpty(
				[
					manifest?.runtimeManifestFile,
					manifest?.stdoutPath,
					manifest?.stderrPath,
					swarm.claimLedgerPath,
					...(worker.sourceArtifacts ?? []),
				],
				16,
			),
		};
	});
}
