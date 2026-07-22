/** Swarm worker subagent execution. */

import { createAgentThreadManager } from "../../agent-thread-manager.ts";
import type { OperationStepStatus } from "../operation-step.ts";
import { truncateMiddle } from "../text.ts";
import { swarmExecutionDigest, swarmWorkerSpec } from "./pure-basics.ts";

type SwarmArtifact = any;
type SwarmWorkerRuntime = any;
type SwarmWorkerExecution = any;

export async function executeSwarmWorkerSubagent(
	worker: SwarmWorkerRuntime,
	swarm: SwarmArtifact,
	cwd: string,
	timeoutMs: number,
	attempt = 1,
): Promise<SwarmWorkerExecution[]> {
	const spec = swarmWorkerSpec(worker.worker);
	const task = [
		`You are a REPI ${spec} subagent executing a swarm worker packet. Return ONLY a distilled handoff: Outcome, Key Evidence (command/path/hash/offset/request-response), Verification, Next Step, and unresolved gaps. No raw logs.`,
		`objective: ${worker.objective}`,
		`worker: ${worker.worker}`,
		swarm.target ? `target: ${swarm.target}` : "",
		`evidence_contract: ${worker.evidenceContract.join(" | ") || "(none)"}`,
		`merge_keys: ${worker.mergeKeys.join(" | ") || "(none)"}`,
		`suggested_commands: ${worker.commands.join(" || ") || "(none)"}`,
		...(worker.spawnPrompt.length ? ["", "## spawn_prompt", ...worker.spawnPrompt] : []),
	]
		.filter(Boolean)
		.join("\n");
	const mgr = createAgentThreadManager({ cwd });
	const startedAt = new Date().toISOString();
	const startMs = Date.now();
	try {
		const started = await mgr.spawnThread({ specName: spec, task, timeoutMs, inheritMcp: true });
		const final = await mgr.awaitRun(started.runId);
		const merge = mgr.mergeRun(started.runId);
		const mergeText = merge?.text ?? "(no merge output)";
		const endedMs = Date.now();
		const elapsedMs = Math.max(0, endedMs - startMs);
		const timedOut =
			elapsedMs > timeoutMs || /timeout|timed out/i.test(final.error ?? "") || final.signal === "SIGTERM";
		const status: OperationStepStatus = final.status === "complete" ? "done" : "blocked";
		const execution: SwarmWorkerExecution = {
			workerId: worker.id,
			worker: worker.worker,
			command: `re_subagent spec=${spec} task="${truncateMiddle(worker.objective, 80)}"`,
			status,
			output: [
				"parallel_mode=real_subagent",
				"isolation=process-agent-home",
				`spec=${spec}`,
				`timeout_ms=${timeoutMs} timed_out=${timedOut} retry_attempt=${attempt}`,
				`run_id=${final.runId}`,
				mergeText,
			].join("\n"),
			stdout: mergeText,
			stderr: final.error ?? "",
			stdoutSha256: swarmExecutionDigest(mergeText),
			stderrSha256: swarmExecutionDigest(final.error ?? ""),
			startedAt,
			endedAt: new Date(endedMs).toISOString(),
			elapsedMs,
			pid: final.pid ?? null,
			parentPid: null,
			exitCode: final.exitCode ?? (status === "done" ? 0 : 1),
			signal: timedOut ? "SIGTERM" : (final.signal ?? null),
			timeoutMs,
			timedOut,
			cancelledAt: timedOut ? new Date(endedMs).toISOString() : undefined,
			retryAttempt: attempt,
			sourceArtifacts: Array.from(
				new Set(
					[final.runRoot, final.manifestPath, final.mergePath].filter((item): item is string => Boolean(item)),
				),
			),
		};
		return [execution];
	} catch (error) {
		const endedMs = Date.now();
		const message = String((error as Error).message ?? error);
		const elapsedMs = Math.max(0, endedMs - startMs);
		const timedOut = elapsedMs > timeoutMs || /timeout|timed out/i.test(message);
		return [
			{
				workerId: worker.id,
				worker: worker.worker,
				command: `re_subagent spec=${spec} (blocked)`,
				status: "blocked",
				output: `parallel_mode=real_subagent\nisolation=process-agent-home\ntimeout_ms=${timeoutMs} timed_out=${timedOut} retry_attempt=${attempt}\nblocked: ${truncateMiddle(message, 400)}`,
				stdout: "",
				stderr: message,
				stdoutSha256: swarmExecutionDigest(""),
				stderrSha256: swarmExecutionDigest(message),
				startedAt,
				endedAt: new Date(endedMs).toISOString(),
				elapsedMs,
				pid: null,
				parentPid: null,
				exitCode: 1,
				signal: timedOut ? "SIGTERM" : null,
				timeoutMs,
				timedOut,
				cancelledAt: timedOut ? new Date(endedMs).toISOString() : undefined,
				retryAttempt: attempt,
				sourceArtifacts: worker.sourceArtifacts,
			},
		];
	}
}
