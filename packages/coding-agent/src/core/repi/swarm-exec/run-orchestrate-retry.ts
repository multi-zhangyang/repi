/** Swarm worker blocked-command retry loop. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { executeSwarmWorkerCommand, executeSwarmWorkerSubagent } from "./execute.ts";

type Swarm = any;
type SwarmWorkerExecution = any;

export async function retryBlockedSwarmWorkerExecutions(
	pi: ExtensionAPI,
	worker: any,
	swarm: Swarm,
	executions: SwarmWorkerExecution[],
	options: {
		maxCommands: number;
		realMode: boolean;
		cwd?: string;
		timeoutMs: number;
		retryLimit: number;
	},
): Promise<void> {
	const { maxCommands, realMode, cwd, timeoutMs, retryLimit } = options;
	for (let retry = 1; retry <= retryLimit && executions.some((item: any) => item.status === "blocked"); retry++) {
		const attempt = retry + 1;
		const retryCommand = worker.commands[maxCommands + retry - 1] ?? worker.commands[0];
		if (!retryCommand) break;
		if (realMode) {
			const retryExecutions = await executeSwarmWorkerSubagent(worker, swarm, cwd as string, timeoutMs, attempt);
			for (const retryExecution of retryExecutions) {
				retryExecution.output = [
					`retry_execution: worker=${worker.id} attempt=${attempt}/${retryLimit + 1} previous_blocked=true`,
					retryExecution.output,
				].join("\n");
			}
			executions.push(...retryExecutions);
		} else {
			const retryExecution = await executeSwarmWorkerCommand(
				pi,
				worker,
				retryCommand,
				swarm.target,
				timeoutMs,
				attempt,
			);
			retryExecution.output = [
				`retry_execution: worker=${worker.id} attempt=${attempt}/${retryLimit + 1} previous_blocked=true`,
				retryExecution.output,
			].join("\n");
			executions.push(retryExecution);
		}
		if (executions.at(-1)?.status === "done") break;
	}
}
