/** Attack-graph runtime adapter stdout/stderr output nodes. */
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendRuntimeAdapterStreamOutputs(
	ctx: AttackGraphBuildCtx,
	params: {
		path: string;
		artifact: any;
		artifactId: string;
		artifactBase: string;
		commandId: string;
	},
): void {
	const { path, artifact, artifactId, artifactBase, commandId } = params;
	for (const stream of [
		{ name: "stdout", hash: artifact.stdoutSha256, head: artifact.stdoutHead },
		{ name: "stderr", hash: artifact.stderrSha256, head: artifact.stderrHead },
	]) {
		const outputId = `artifact:runtime-output:${ctx.slug(artifact.adapterId)}:${ctx.slug(artifactBase)}:${stream.name}`;
		const outputHead = ctx.truncateMiddle((stream.head ?? "").replace(/\s+/g, " ").trim(), 260);
		ctx.addNode({
			id: outputId,
			kind: "artifact",
			label: `${stream.name} sha256=${stream.hash.slice(0, 16)}`,
			status: "runtime-output-hash",
			path,
			note: outputHead || `${stream.name} empty`,
		});
		ctx.addTask({
			id: outputId,
			parentId: artifactId,
			kind: "artifact",
			label: `${stream.name} sha256=${stream.hash.slice(0, 16)}`,
			status: "runtime-output-hash",
			path,
			evidence: [
				`${stream.name}_sha256=${stream.hash}`,
				outputHead ? `${stream.name}_head=${outputHead}` : `${stream.name}_empty`,
			],
		});
		ctx.addEdge({ from: commandId, to: outputId, kind: "produces", label: stream.name });
		ctx.addEdge({ from: outputId, to: artifactId, kind: "evidences", label: `${stream.name}_hash` });
	}
}
