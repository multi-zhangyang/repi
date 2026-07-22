/** Write swarm subagent session stdout/stderr files. */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteFileSync } from "../../runtime-adapter-exec-deps.ts";
import { slug } from "../../text.ts";
import { swarmSubagentSessionRoot } from "../pure.ts";

type SwarmArtifact = any;
type SwarmWorkerRuntime = any;
type SwarmWorkerExecution = any;

export function writeSwarmWorkerSessionStreams(params: {
	swarm: SwarmArtifact;
	worker: SwarmWorkerRuntime;
	executions: SwarmWorkerExecution[];
}): {
	sessionDir: string;
	stdoutPath: string;
	stderrPath: string;
	runtimeManifestFile: string;
	stdout: string;
	stderr: string;
} {
	const { swarm, worker, executions } = params;
	const sessionDir = join(swarmSubagentSessionRoot(swarm), slug(worker.id));
	mkdirSync(sessionDir, { recursive: true });
	const stdoutPath = join(sessionDir, "stdout.txt");
	const stderrPath = join(sessionDir, "stderr.txt");
	const runtimeManifestFile = join(sessionDir, "runtime-manifest.json");
	const stdout = executions.length
		? executions
				.map((execution: any, index: any) =>
					[`## command ${index + 1}: ${execution.command}`, execution.stdout ?? execution.output ?? ""].join("\n"),
				)
				.join("\n\n")
		: `worker=${worker.id} status=queued no command selected for this bounded re_swarm run\n`;
	const stderr = executions.length
		? executions
				.map((execution: any, index: any) =>
					[`## command ${index + 1}: ${execution.command}`, execution.stderr ?? ""].join("\n"),
				)
				.join("\n\n")
		: "";
	atomicWriteFileSync(stdoutPath, stdout, 0o644);
	atomicWriteFileSync(stderrPath, stderr, 0o644);
	return { sessionDir, stdoutPath, stderrPath, runtimeManifestFile, stdout, stderr };
}
