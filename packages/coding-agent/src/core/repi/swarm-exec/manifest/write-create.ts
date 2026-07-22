/** Create/write swarm subagent runtime manifest. */
// Landmark: writeSwarmSubagentRuntimeManifest buildSwarmSubagentRuntimeManifestObject reverse evidenceRefs
import { atomicWriteFileSync } from "../../runtime-adapter-exec-deps.ts";
import { buildSwarmSubagentRuntimeManifestObject } from "./write-create-build.ts";
import { writeSwarmWorkerSessionStreams } from "./write-create-io.ts";

type SwarmArtifact = any;
type SwarmWorkerRuntime = any;
type SwarmWorkerExecution = any;
type SwarmSubagentRuntimeManifestRow = any;
export function writeSwarmSubagentRuntimeManifest(params: {
	swarm: SwarmArtifact;
	worker: SwarmWorkerRuntime;
	executions: SwarmWorkerExecution[];
	attempt: number;
	maxCommands: number;
	timeoutMs?: number;
}): SwarmSubagentRuntimeManifestRow {
	const { swarm, worker, executions, attempt, maxCommands } = params;
	const timeoutMs =
		params.timeoutMs ??
		Math.max(
			1000,
			Math.min(30 * 60 * 1000, Math.max(...executions.map((execution: any) => execution.timeoutMs ?? 0), 60000)),
		);
	const { sessionDir, stdoutPath, stderrPath, runtimeManifestFile, stdout, stderr } = writeSwarmWorkerSessionStreams({
		swarm,
		worker,
		executions,
	});
	const manifest = buildSwarmSubagentRuntimeManifestObject({
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
	});
	atomicWriteFileSync(
		runtimeManifestFile,
		`${JSON.stringify(manifest, null, 2)}
`,
		0o644,
	);
	return {
		...manifest,
		runtimeManifestFile,
	};
}
