/** Swarm run orchestration (execute workers + write artifacts). */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { autoModeDefaults } from "../auto-lane.ts";
import { appendSwarmWorkerMemoryEvents } from "../memory-transaction.ts";
import { formatSwarm } from "../swarm-format.ts";
import {
	buildSwarm,
	swarmClaimLedgerPath,
	swarmSubagentRuntimeManifestIndexPath,
	writeSwarmArtifact,
} from "../swarm-runtime.ts";
import { envBoolean } from "../text.ts";
import { refreshSwarmRunDerivedFields } from "./execute.ts";
import { ensureQueuedWorkerManifests, executeSwarmSelectedWorkers } from "./run-orchestrate-workers.ts";

export async function runSwarm(
	pi: ExtensionAPI,
	options: {
		target?: string;
		task?: string;
		maxWorkers?: number;
		maxCommands?: number;
		execution?: "simulated" | "real";
		cwd?: string;
	} = {},
): Promise<string> {
	let swarm = buildSwarm({ target: options.target, task: options.task, mode: "run" });
	swarm.claimLedgerPath = swarmClaimLedgerPath(swarm);
	swarm.subagentRuntimeManifestPath = swarmSubagentRuntimeManifestIndexPath(swarm);
	const maxWorkers = Math.max(1, Math.min(8, Math.floor(options.maxWorkers ?? 3)));
	const maxCommands = Math.max(1, Math.min(5, Math.floor(options.maxCommands ?? 1)));
	const execution = options.execution ?? autoModeDefaults().swarmExecution;
	const realMode = execution === "real" && Boolean(options.cwd) && !envBoolean("REPI_AGENT_THREAD");
	swarm = await executeSwarmSelectedWorkers(pi, swarm, {
		maxWorkers,
		maxCommands,
		realMode,
		cwd: options.cwd,
	});
	swarm = ensureQueuedWorkerManifests(swarm, { maxCommands, realMode });
	swarm = refreshSwarmRunDerivedFields(swarm);
	writeSwarmArtifact(swarm);
	appendSwarmWorkerMemoryEvents(swarm);
	swarm = refreshSwarmRunDerivedFields(swarm);
	const path = writeSwarmArtifact(swarm);
	return formatSwarm(swarm as any, path);
}
