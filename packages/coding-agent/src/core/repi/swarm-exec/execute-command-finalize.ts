/** Swarm worker execution finalize helpers. */
import { swarmExecutionDigest } from "./pure.ts";

type SwarmWorkerExecution = any;

export function finalizeSwarmWorkerExecution(
	execution: Omit<SwarmWorkerExecution, "startedAt" | "endedAt" | "elapsedMs">,
	params: { startedMs: number; timeoutMs: number; attempt: number },
): SwarmWorkerExecution {
	const endedMs = Date.now();
	const stdout = execution.stdout ?? execution.output;
	const stderr = execution.stderr ?? "";
	return {
		...execution,
		stdout,
		stderr,
		stdoutSha256: execution.stdoutSha256 ?? swarmExecutionDigest(stdout),
		stderrSha256: execution.stderrSha256 ?? swarmExecutionDigest(stderr),
		startedAt: new Date(params.startedMs).toISOString(),
		endedAt: new Date(endedMs).toISOString(),
		elapsedMs: Math.max(0, endedMs - params.startedMs),
		exitCode: execution.exitCode ?? (execution.status === "done" ? 0 : 1),
		signal: execution.signal ?? null,
		timeoutMs: execution.timeoutMs ?? params.timeoutMs,
		timedOut: execution.timedOut ?? false,
		cancelledAt: execution.cancelledAt,
		retryAttempt: execution.retryAttempt ?? params.attempt,
	};
}

export function blockedSwarmWorkerExecution(params: {
	worker: any;
	command: string;
	rawCommand: string;
	output: string;
	timeoutMs: number;
	attempt: number;
	startedMs: number;
}): SwarmWorkerExecution {
	return finalizeSwarmWorkerExecution(
		{
			workerId: params.worker.id,
			worker: params.worker.worker,
			command: params.command || params.rawCommand,
			status: "blocked",
			output: params.output,
			stdout: params.output,
			stderr: "",
			pid: process.pid,
			parentPid: process.ppid,
			exitCode: 1,
			signal: null,
			timeoutMs: params.timeoutMs,
			timedOut: false,
			retryAttempt: params.attempt,
			sourceArtifacts: params.worker.sourceArtifacts,
		},
		{ startedMs: params.startedMs, timeoutMs: params.timeoutMs, attempt: params.attempt },
	);
}
