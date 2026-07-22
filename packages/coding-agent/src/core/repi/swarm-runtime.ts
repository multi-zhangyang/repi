/**
 * Swarm plan/build/write/show surface (runtime refresh helpers injected).
 * Implementation under ./swarm-runtime/*.
 */

export {
	buildSwarm,
	buildSwarmOutput,
	buildSwarmParallelPlan,
	swarmArtifactGlobs,
	swarmDependencies,
	swarmMergeKeys,
	swarmPlanCoverage,
	swarmSpawnPrompt,
	writeSwarmArtifact,
} from "./swarm-runtime/build.ts";
export {
	configureSwarmRuntime,
	d,
} from "./swarm-runtime/deps.ts";
export {
	latestSwarmArtifactPath,
	latestSwarmRunArtifactPath,
	swarmArtifactPath,
	swarmClaimLedgerPath,
	swarmStructuredClaimMergePath,
	swarmSubagentRuntimeManifestIndexPath,
	swarmWorkerLeaseSchedulerPath,
	swarmWorkerRetryHandoffClosurePath,
	swarmWorkerRetryHandoffMergeSummaryPath,
} from "./swarm-runtime/paths.ts";
export {
	latestSwarmRetryQueue,
	splitRetryNextCommands,
	swarmReleaseCheckMetadata,
} from "./swarm-runtime/release.ts";
export type {
	SwarmArtifact,
	SwarmRuntimeDeps,
	SwarmWorkerRuntime,
} from "./swarm-runtime/types.ts";
