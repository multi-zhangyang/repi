/** Swarm worker group execution + queued manifests. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { executeSwarmWorkerCommand, executeSwarmWorkerSubagent, refreshSwarmRunDerivedFields } from "./execute.ts";
import { refreshSwarmSubagentRuntimeManifestCapture, writeSwarmSubagentRuntimeManifest } from "./manifest.ts";
import { swarmWorkerGroups, swarmWorkerRetryLimit, swarmWorkerTimeoutMs } from "./pure.ts";
import { retryBlockedSwarmWorkerExecutions } from "./run-orchestrate-retry.ts";

type Swarm = any;
type SwarmWorkerExecution = any;

export async function executeSwarmSelectedWorkers(
	pi: ExtensionAPI,
	swarmIn: Swarm,
	options: {
		maxWorkers: number;
		maxCommands: number;
		realMode: boolean;
		cwd?: string;
	},
): Promise<Swarm> {
	let swarm = swarmIn;
	const retryLimit = swarmWorkerRetryLimit(options.realMode ? "real" : "simulated");
	const selected = new Set<string>(
		swarm.workers
			.filter((worker: any) => worker.status === "ready")
			.slice(0, options.maxWorkers)
			.map((worker: any) => worker.id),
	);
	for (const group of swarmWorkerGroups(swarm, selected)) {
		const groupRuns = await Promise.all(
			group.map(async (worker: any) => {
				const executions: SwarmWorkerExecution[] = [];
				const timeoutMs = swarmWorkerTimeoutMs(worker, options.realMode ? "real" : "simulated");
				if (options.realMode) {
					executions.push(
						...(await executeSwarmWorkerSubagent(worker, swarm, options.cwd as string, timeoutMs, 1)),
					);
				} else {
					for (const command of worker.commands.slice(0, options.maxCommands)) {
						executions.push(await executeSwarmWorkerCommand(pi, worker, command, swarm.target, timeoutMs, 1));
					}
				}
				await retryBlockedSwarmWorkerExecutions(pi, worker, swarm, executions, {
					maxCommands: options.maxCommands,
					realMode: options.realMode,
					cwd: options.cwd,
					timeoutMs,
					retryLimit,
				});
				const manifest = writeSwarmSubagentRuntimeManifest({
					swarm,
					worker,
					executions,
					attempt: Math.max(1, ...executions.map((item: any) => item.retryAttempt ?? 1)),
					maxCommands: options.maxCommands,
					timeoutMs,
				});
				return { executions, manifest };
			}),
		);
		swarm.executions.push(...groupRuns.flatMap((run: any) => run.executions));
		swarm.subagentRuntimeManifests.push(...groupRuns.map((run: any) => run.manifest));
		swarm = refreshSwarmSubagentRuntimeManifestCapture(swarm);
		swarm = refreshSwarmRunDerivedFields(swarm);
	}
	return swarm;
}

export function ensureQueuedWorkerManifests(
	swarmIn: Swarm,
	options: { maxCommands: number; realMode: boolean },
): Swarm {
	let swarm = swarmIn;
	const manifestedWorkers = new Set<string>(swarm.subagentRuntimeManifests.map((m: any) => m.workerId));
	const queuedManifests = swarm.workers
		.filter((worker: any) => !manifestedWorkers.has(worker.id))
		.map((worker: any) =>
			writeSwarmSubagentRuntimeManifest({
				swarm,
				worker,
				executions: [],
				attempt: 1,
				maxCommands: options.maxCommands,
				timeoutMs: swarmWorkerTimeoutMs(worker, options.realMode ? "real" : "simulated"),
			}),
		);
	if (queuedManifests.length) {
		swarm.subagentRuntimeManifests.push(...queuedManifests);
		swarm = refreshSwarmSubagentRuntimeManifestCapture(swarm);
	}
	return swarm;
}
