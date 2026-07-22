/** Swarm worker lease scheduler refresh. */
import { atomicWriteFileSync } from "../../../tools/atomic-write.ts";
import { swarmWorkerLeaseSchedulerPath } from "../../swarm-runtime.ts";
import { buildWorkerLeaseSchedulerFromSwarm } from "../../worker-lease-scheduler.ts";
import { verifyWorkerLeaseSchedulerV1 } from "../../worker-runtime.ts";

type SwarmArtifact = any;

export function refreshSwarmWorkerLeaseScheduler(swarm: SwarmArtifact): SwarmArtifact {
	const path = swarmWorkerLeaseSchedulerPath(swarm);
	if (!swarm.workers.length) {
		return {
			...swarm,
			workerLeaseSchedulerPath: path,
			workerLeaseSchedulerStatus: "missing",
			workerLeaseSchedulerErrors: ["swarm_workers_missing"],
		};
	}
	const scheduler = buildWorkerLeaseSchedulerFromSwarm({ ...swarm, workerLeaseSchedulerPath: path });
	const validation = verifyWorkerLeaseSchedulerV1(scheduler);
	// opt #162: atomic temp+rename — torn write no longer truncates the worker
	// lease scheduler manifest.
	atomicWriteFileSync(path, `${JSON.stringify({ scheduler, validation }, null, 2)}\n`, 0o644);
	return {
		...swarm,
		workerLeaseSchedulerPath: path,
		workerLeaseScheduler: scheduler,
		workerLeaseSchedulerStatus: validation.ok ? "pass" : "blocked",
		workerLeaseSchedulerErrors: validation.errors,
		sourceArtifacts: Array.from(
			new Set(
				[
					...swarm.sourceArtifacts,
					path,
					swarm.claimLedgerPath,
					swarm.structuredClaimMergePath,
					swarm.subagentRuntimeManifestPath,
					swarm.workerChildSessionRuntimePath,
				].filter((item): item is string => Boolean(item)),
			),
		).slice(0, 96),
	};
}
