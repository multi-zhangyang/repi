/** Runtime-adapter artifact/command graph nodes. */
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendRuntimeAdapterArtifactCommandNodes(
	ctx: AttackGraphBuildCtx,
	params: {
		path: string;
		artifact: any;
		artifactBase: string;
		adapterId: string;
		artifactId: string;
		commandId: string;
		parserMatchCount: number;
	},
): void {
	const { path, artifact, artifactBase, adapterId, artifactId, commandId, parserMatchCount } = params;
	ctx.addNode({
		id: artifactId,
		kind: "artifact",
		label: artifactBase,
		status: `exit=${artifact.exitCode ?? "null"} parser_matches=${parserMatchCount}`,
		path,
		note: `stdout_sha256=${artifact.stdoutSha256} stderr_sha256=${artifact.stderrSha256}`,
	});
	ctx.addTask({
		id: artifactId,
		parentId: adapterId,
		kind: "artifact",
		label: artifactBase,
		status: `exit=${artifact.exitCode ?? "null"} parser_matches=${parserMatchCount}`,
		path,
		evidence: [
			`artifact_kinds=${artifact.artifactKinds.join(",")}`,
			`proof_exit=${artifact.proofExitSignals.join(" | ")}`,
			`stdout_sha256=${artifact.stdoutSha256}`,
			`stderr_sha256=${artifact.stderrSha256}`,
		],
	});

	ctx.addNode({
		id: commandId,
		kind: "command",
		label: ctx.truncateMiddle(artifact.command, 160),
		status: artifact.killed ? "killed" : `exit=${artifact.exitCode ?? "null"}`,
		note: `runner=${artifact.selectedRunner}`,
	});
	ctx.addTask({
		id: commandId,
		parentId: artifactId,
		kind: "command",
		label: ctx.truncateMiddle(artifact.command, 180),
		status: artifact.killed ? "killed" : `exit=${artifact.exitCode ?? "null"}`,
		command: artifact.command,
	});
	ctx.addEdge({ from: adapterId, to: commandId, kind: "requires", label: artifact.selectedRunner });
	ctx.addEdge({ from: commandId, to: artifactId, kind: "produces", label: "runtime-adapter-json" });
}
