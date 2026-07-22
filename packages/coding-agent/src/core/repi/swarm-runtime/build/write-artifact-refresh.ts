/** Refresh swarm runtime ledgers/manifests before artifact write. */

import {
	refreshSwarmRuntimeClaimLedger,
	refreshSwarmSubagentRuntimeManifestCapture,
	refreshSwarmWorkerChildSessionRuntime,
	refreshSwarmWorkerLeaseScheduler,
	refreshSwarmWorkerRetryHandoffClosure,
} from "../deps.ts";
import {
	swarmClaimLedgerPath,
	swarmStructuredClaimMergePath,
	swarmSubagentRuntimeManifestIndexPath,
	swarmWorkerLeaseSchedulerPath,
	swarmWorkerRetryHandoffClosurePath,
	swarmWorkerRetryHandoffMergeSummaryPath,
} from "../paths.ts";
import type { SwarmArtifact } from "../types.ts";

export function refreshSwarmArtifactRuntimeState(swarm: SwarmArtifact): SwarmArtifact {
	swarm.claimLedgerPath = swarmClaimLedgerPath(swarm);
	swarm.structuredClaimMergePath = swarmStructuredClaimMergePath(swarm);
	swarm.subagentRuntimeManifestPath = swarmSubagentRuntimeManifestIndexPath(swarm);
	swarm.workerLeaseSchedulerPath = swarmWorkerLeaseSchedulerPath(swarm);
	swarm.workerRetryHandoffClosurePath = swarmWorkerRetryHandoffClosurePath(swarm);
	swarm.workerRetryHandoffMergeSummaryPath = swarmWorkerRetryHandoffMergeSummaryPath(swarm);
	Object.assign(swarm, refreshSwarmSubagentRuntimeManifestCapture(swarm));
	Object.assign(swarm, refreshSwarmRuntimeClaimLedger(swarm));
	Object.assign(swarm, refreshSwarmWorkerChildSessionRuntime(swarm));
	Object.assign(swarm, refreshSwarmWorkerRetryHandoffClosure(swarm));
	Object.assign(swarm, refreshSwarmWorkerLeaseScheduler(swarm));
	return swarm;
}
