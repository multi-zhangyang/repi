/** Build swarm subagent runtime manifest object. */
import { createHash } from "node:crypto";
import { runtimeFailureLedgerPath, runtimeRepairQueuePath } from "../../storage.ts";
import { swarmClaimLedgerPath } from "../../swarm-runtime.ts";
import {
	swarmExecutionDigest,
	swarmRuntimeModel,
	swarmRuntimeRetryBudget,
	swarmRuntimeStatus,
	swarmRuntimeTimeWindow,
} from "../pure.ts";
import { swarmManifestReverseEvidenceRefs } from "./write-create-reverse.ts";

type SwarmArtifact = any;
type SwarmWorkerRuntime = any;
type SwarmWorkerExecution = any;
type SwarmSubagentRuntimeManifestV1 = any;

export function buildSwarmSubagentRuntimeManifestObject(params: {
	swarm: SwarmArtifact;
	worker: SwarmWorkerRuntime;
	executions: SwarmWorkerExecution[];
	attempt: number;
	maxCommands: number;
	timeoutMs: number;
	sessionDir: string;
	stdoutPath: string;
	stderrPath: string;
	stdout: string;
	stderr: string;
}): SwarmSubagentRuntimeManifestV1 {
	const {
		swarm,
		worker,
		executions,
		attempt,
		maxCommands,
		timeoutMs,
		sessionDir,
		stdoutPath,
		stderrPath,
		stdout,
		stderr,
	} = params;
	const stdoutSha256 = swarmExecutionDigest(stdout);
	const stderrSha256 = swarmExecutionDigest(stderr);
	const status = swarmRuntimeStatus(executions);
	const timing = swarmRuntimeTimeWindow(executions, swarm.timestamp);
	const pid = executions.find((execution: any) => Number.isInteger(execution.pid))?.pid ?? process.pid;
	const parentPid =
		executions.find((execution: any) => Number.isInteger(execution.parentPid))?.parentPid ?? process.ppid;
	const exitCode =
		status === "queued"
			? null
			: status === "done"
				? 0
				: (executions.find((execution: any) => execution.status === "blocked")?.exitCode ?? 1);
	const signal = executions.find((execution: any) => execution.signal)?.signal ?? null;
	const model = swarmRuntimeModel(executions);
	const evidenceRefs = swarmManifestReverseEvidenceRefs({
		worker,
		swarm,
		baseRefs: [
			swarm.delegationArtifact,
			...worker.sourceArtifacts,
			...executions.flatMap((execution: any) => execution.sourceArtifacts),
			stdoutPath,
			stderrPath,
		],
	});
	const toolCallDigest = createHash("sha256")
		.update(
			JSON.stringify({
				workerId: worker.id,
				attempt,
				commands: executions.map((execution: any) => execution.command),
				statuses: executions.map((execution: any) => execution.status),
				stdoutSha256,
				stderrSha256,
				model,
			}),
		)
		.digest("hex");
	return {
		kind: "SubagentRuntimeManifestV1",
		schemaVersion: 1,
		runId: swarm.parallelPlan?.planId ?? `re_swarm/${swarm.timestamp}`,
		roleId: worker.worker,
		workerId: worker.id,
		attempt,
		status,
		pid,
		parentPid,
		sessionDir,
		stdoutPath,
		stderrPath,
		stdoutSha256,
		stderrSha256,
		startedAt: timing.startedAt,
		endedAt: timing.endedAt,
		elapsedMs: timing.elapsedMs,
		exitCode,
		signal,
		model,
		toolCallDigest,
		claimLedgerPath: swarm.claimLedgerPath ?? swarmClaimLedgerPath(swarm),
		failureLedgerPath: runtimeFailureLedgerPath(),
		repairQueuePath: runtimeRepairQueuePath(),
		resourceLimits: {
			timeoutMs,
			maxCommands,
			maxOutputBytes: Buffer.byteLength(stdout) + Buffer.byteLength(stderr),
			cancelOnTimeout: true,
		},
		retryBudget: swarmRuntimeRetryBudget(worker, attempt),
		mergeKeys: worker.mergeKeys,
		evidenceRefs,
	};
}
