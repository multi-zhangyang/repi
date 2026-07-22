/** Attack-graph proof-loop runtime nodes. */

import { runtimeArtifactsForCommand } from "../../graph-artifacts.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendProofLoopRuntimeExecutions(
	ctx: AttackGraphBuildCtx,
	args: { path: string; proof: any; proofBase: string; proofId: string },
): void {
	const { path, proof, proofBase, proofId } = args;
	for (const execution of proof.executed.slice(0, 12)) {
		const executionId = `run:proof-loop:${ctx.slug(proofBase)}:${ctx.slug(execution.stepId)}`;
		const outputText = execution.output.replace(/\s+/g, " ");
		const outputHash = ctx.sha256Text(execution.output);
		const outputId = `artifact:proof-loop-output:${ctx.slug(proofBase)}:${ctx.slug(execution.stepId)}`;
		ctx.addNode({
			id: executionId,
			kind: "run",
			label: ctx.truncateMiddle(execution.command, 160),
			status: execution.status,
			note: ctx.truncateMiddle(outputText, 260),
		});
		ctx.addTask({
			id: executionId,
			parentId: proofId,
			kind: "run",
			label: ctx.truncateMiddle(execution.command, 180),
			status: execution.status,
			command: execution.command,
			evidence: [`output_sha256=${outputHash}`, `output=${ctx.truncateMiddle(outputText, 260)}`],
		});
		ctx.addNode({
			id: outputId,
			kind: "artifact",
			label: `proof-loop-output sha256=${outputHash.slice(0, 16)}`,
			status: "proof-loop-output-hash",
			path,
			note: ctx.truncateMiddle(outputText, 260),
		});
		ctx.addTask({
			id: outputId,
			parentId: executionId,
			kind: "artifact",
			label: `proof-loop-output sha256=${outputHash.slice(0, 16)}`,
			status: "proof-loop-output-hash",
			path,
			evidence: [`output_sha256=${outputHash}`],
		});
		ctx.addEdge({ from: executionId, to: outputId, kind: "produces", label: "proof-loop-output" });
		ctx.addEdge({
			from: outputId,
			to: proofId,
			kind: execution.status === "blocked" ? "blocks" : "verifies",
			label: "executed-output-hash",
		});
		for (const lineage of runtimeArtifactsForCommand(execution.command, ctx.runtimeArtifactLineage).slice(0, 4)) {
			const lineageId = `artifact:proof-loop-runtime-execution:${ctx.slug(proofBase)}:${ctx.slug(execution.stepId)}:${ctx.slug(lineage.artifactBase)}`;
			ctx.addNode({
				id: lineageId,
				kind: "artifact",
				label: lineage.artifactBase,
				status: `runtime-adapter-lineage ${lineage.adapterId}`,
				path: lineage.path,
				note: `executed=${execution.status} target=${lineage.target || "<none>"}`,
			});
			ctx.addTask({
				id: lineageId,
				parentId: executionId,
				kind: "artifact",
				label: lineage.artifactBase,
				status: `runtime-adapter-lineage ${lineage.adapterId}`,
				path: lineage.path,
				evidence: [
					`adapter=${lineage.adapterId}`,
					`target=${lineage.target || "<none>"}`,
					`runtime_artifact=${lineage.path}`,
					`proof_execution=${execution.status}`,
				],
			});
			ctx.addEdge({ from: executionId, to: lineageId, kind: "produces", label: "runtime-adapter-lineage" });
			ctx.addEdge({ from: lineageId, to: lineage.artifactId, kind: "supports", label: "runtime-adapter-json" });
			ctx.addEdge({ from: lineage.artifactId, to: proofId, kind: "verifies", label: "runtime-adapter-artifact" });
		}
	}
}
