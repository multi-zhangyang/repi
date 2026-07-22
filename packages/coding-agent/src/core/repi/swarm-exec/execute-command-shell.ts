/** Shell-path swarm worker command execution. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { truncateMiddle } from "../text.ts";
import { swarmExecuteReverseNotes } from "./execute-command-reverse.ts";
import { stripSwarmPidMarker, swarmExecutionDigest } from "./pure.ts";

type SwarmWorkerRuntime = any;
type SwarmWorkerExecution = any;

export async function executeSwarmWorkerShellCommand(params: {
	pi: ExtensionAPI;
	worker: SwarmWorkerRuntime;
	command: string;
	timeoutMs: number;
	attempt: number;
	finalize: (execution: any) => SwarmWorkerExecution;
}): Promise<SwarmWorkerExecution> {
	const { pi, worker, command, timeoutMs, attempt, finalize } = params;
	const result = await pi.exec(
		"bash",
		["-lc", `printf '__repi_swarm_pid=%s ppid=%s\\n' "$$" "$PPID" >&2\nset -o pipefail\n${command}`],
		{ timeout: timeoutMs },
	);
	const marker = stripSwarmPidMarker(result.stderr);
	const stdout = result.stdout;
	const stderr = marker.stderr;
	const timedOut = Boolean(result.killed);
	const endedAt = new Date().toISOString();
	const status = result.code === 0 && !result.killed ? "done" : "blocked";
	const reverseNotes = swarmExecuteReverseNotes({
		worker,
		command,
		status,
		output: `${stdout}\n${stderr}`,
	});
	const output = [
		`exit=${result.code}${result.killed ? " killed=true" : ""}`,
		`timeout_ms=${timeoutMs} timed_out=${timedOut}${timedOut ? ` cancelled_at=${endedAt}` : ""} retry_attempt=${attempt}`,
		`pid=${marker.pid ?? "unknown"} parent_pid=${marker.parentPid ?? "unknown"}`,
		`stdout_sha256=${swarmExecutionDigest(stdout)}`,
		`stderr_sha256=${swarmExecutionDigest(stderr)}`,
		`stdout=${truncateMiddle(stdout.trim(), 1200)}`,
		`stderr=${truncateMiddle(stderr.trim(), 1200)}`,
		...reverseNotes,
	].join("\n");
	return finalize({
		workerId: worker.id,
		worker: worker.worker,
		command,
		status,
		output,
		stdout,
		stderr,
		stdoutSha256: swarmExecutionDigest(stdout),
		stderrSha256: swarmExecutionDigest(stderr),
		pid: marker.pid,
		parentPid: marker.parentPid,
		exitCode: result.code,
		signal: timedOut ? "SIGTERM" : null,
		timeoutMs,
		timedOut,
		cancelledAt: timedOut ? endedAt : undefined,
		retryAttempt: attempt,
		sourceArtifacts: worker.sourceArtifacts,
	});
}
