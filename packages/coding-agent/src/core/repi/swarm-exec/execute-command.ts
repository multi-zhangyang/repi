/** Swarm worker command execution. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { executeOperatorStep } from "../operator-step.ts";
import { slug } from "../text.ts";
import { blockedSwarmWorkerExecution, finalizeSwarmWorkerExecution } from "./execute-command-finalize.ts";
import { executeSwarmWorkerShellCommand } from "./execute-command-shell.ts";
import { sanitizeSwarmCommand } from "./pure.ts";

type SwarmWorkerRuntime = any;
type SwarmWorkerExecution = any;

export async function executeSwarmWorkerCommand(
	pi: ExtensionAPI,
	worker: SwarmWorkerRuntime,
	rawCommand: string,
	target?: string,
	timeoutMs = 60000,
	attempt = 1,
): Promise<SwarmWorkerExecution> {
	const command = sanitizeSwarmCommand(rawCommand);
	const startedMs = Date.now();
	const finalize = (
		execution: Omit<SwarmWorkerExecution, "startedAt" | "endedAt" | "elapsedMs">,
	): SwarmWorkerExecution => finalizeSwarmWorkerExecution(execution, { startedMs, timeoutMs, attempt });
	const blocked = (output: string): SwarmWorkerExecution =>
		blockedSwarmWorkerExecution({
			worker,
			command,
			rawCommand,
			output,
			timeoutMs,
			attempt,
			startedMs,
		});
	if (!command) return blocked("empty swarm worker command");
	if (/^re[-_]swarm\s+run\b/i.test(command)) return blocked("recursive swarm run command is not allowed");
	if (/^re[-_]/i.test(command)) {
		const result = await executeOperatorStep(
			pi,
			{
				id: `${worker.id}:${slug(command).slice(0, 24)}`,
				command,
				status: "ready",
				priority: 1,
				sourceArtifacts: worker.sourceArtifacts,
			},
			target,
		);
		return finalize({
			workerId: worker.id,
			worker: worker.worker,
			command: result.command,
			status: result.status,
			output: [
				"parallel_mode=simulated_sequential",
				"isolation=shared-process-internal-dispatch",
				`timeout_ms=${timeoutMs} timed_out=false retry_attempt=${attempt}`,
				"note=internal REPI command executed through in-process operator dispatcher; shell workers still capture child pid",
				result.output,
			].join("\n"),
			stdout: [
				"parallel_mode=simulated_sequential",
				"isolation=shared-process-internal-dispatch",
				`timeout_ms=${timeoutMs} timed_out=false retry_attempt=${attempt}`,
				result.output,
			].join("\n"),
			stderr: "",
			pid: process.pid,
			parentPid: process.ppid,
			exitCode: result.status === "done" ? 0 : 1,
			signal: null,
			timeoutMs,
			timedOut: false,
			retryAttempt: attempt,
			sourceArtifacts: worker.sourceArtifacts,
		});
	}
	return executeSwarmWorkerShellCommand({ pi, worker, command, timeoutMs, attempt, finalize });
}
