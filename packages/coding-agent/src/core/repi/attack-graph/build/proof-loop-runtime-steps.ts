/** Attack-graph proof-loop runtime nodes. */

import { runtimeArtifactsForCommand } from "../../graph-artifacts.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendProofLoopRuntimeSteps(
	ctx: AttackGraphBuildCtx,
	args: { path: string; proof: any; proofBase: string; proofId: string },
): void {
	const { path: _path, proof, proofBase, proofId } = args;
	for (const step of proof.steps.slice(0, 18)) {
		const stepId = `command:proof-loop:${ctx.slug(proofBase)}:${ctx.slug(step.id)}`;
		ctx.addNode({
			id: stepId,
			kind: "command",
			label: ctx.truncateMiddle(step.command, 160),
			status: `${step.phase}/${step.status}`,
			note: step.reason,
		});
		ctx.addTask({
			id: stepId,
			parentId: proofId,
			kind: "command",
			label: ctx.truncateMiddle(step.command, 180),
			status: `${step.phase}/${step.status}`,
			command: step.command,
			evidence: step.sourceArtifacts.slice(0, 4),
			note: step.reason,
		});
		ctx.addEdge({
			from: stepId,
			to: proofId,
			kind: step.status === "blocked" ? "blocks" : step.status === "done" ? "verifies" : "requires",
			label: `proof-loop:${step.phase}`,
		});
		for (const lineage of runtimeArtifactsForCommand(step.command, ctx.runtimeArtifactLineage).slice(0, 4)) {
			const lineageId = `artifact:proof-loop-runtime-lineage:${ctx.slug(proofBase)}:${ctx.slug(step.id)}:${ctx.slug(lineage.artifactBase)}`;
			ctx.addNode({
				id: lineageId,
				kind: "artifact",
				label: lineage.artifactBase,
				status: `runtime-adapter-lineage ${lineage.adapterId}`,
				path: lineage.path,
				note: `target=${lineage.target || "<none>"}`,
			});
			ctx.addTask({
				id: lineageId,
				parentId: stepId,
				kind: "artifact",
				label: lineage.artifactBase,
				status: `runtime-adapter-lineage ${lineage.adapterId}`,
				path: lineage.path,
				evidence: [
					`adapter=${lineage.adapterId}`,
					`target=${lineage.target || "<none>"}`,
					`runtime_artifact=${lineage.path}`,
				],
			});
			ctx.addEdge({ from: stepId, to: lineageId, kind: "produces", label: "runtime-adapter-lineage" });
			ctx.addEdge({ from: lineageId, to: lineage.artifactId, kind: "supports", label: "runtime-adapter-json" });
			ctx.addEdge({ from: lineage.artifactId, to: proofId, kind: "verifies", label: "runtime-adapter-artifact" });
		}
	}
}
