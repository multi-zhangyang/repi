/** Attack-graph build section: proof-loop artifacts. */

/** Attack-graph builder. */
import { existsSync } from "node:fs";
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { appendProofLoopGapSections } from "./proof-loop-gaps.ts";
import { appendProofLoopRuntimeSections } from "./proof-loop-runtime.ts";

export function appendAttackGraphProofLoop(ctx: AttackGraphBuildCtx): void {
	for (const { path, proof } of ctx.proofLoopArtifacts) {
		ctx.sourceArtifacts.push(
			path,
			...proof.sourceArtifacts.filter((artifactPath: any) => existsSync(artifactPath)).slice(0, 8),
		);
		const proofBase = ctx.artifactBasename(path);
		const proofId = `proof-loop:${ctx.slug(proofBase)}`;
		ctx.addNode({
			id: proofId,
			kind: "verification",
			label: `proof_loop ${proof.mode}`,
			status: `verdict=${proof.verdict} executed=${proof.executed.length}`,
			path,
			note: `target=${proof.target ?? "<none>"} max_steps=${proof.maxSteps} replay_steps=${proof.replaySteps}`,
		});
		ctx.addTask({
			id: proofId,
			parentId: proof.missionId
				? `mission:${proof.missionId}`
				: ctx.mission
					? `mission:${ctx.mission.id}`
					: undefined,
			kind: "verification",
			label: `proof_loop ${proof.mode}`,
			status: `verdict=${proof.verdict} executed=${proof.executed.length}`,
			path,
			evidence: [
				`gap_classifier=${proof.gapClassifier.length}`,
				`quick_path=${proof.quickPath.length}`,
				`quick_plan_phases=${proof.quickPlanPhases.length}`,
				`quick_plan_assertions=${proof.quickPlanAssertions.join(" | ") || "none"}`,
				`runtime_adapter_closure=${proof.runtimeAdapterClosure.length}`,
				`next_actions=${proof.nextActions.length}`,
			],
			note: `target=${proof.target ?? "<none>"}`,
		});
		if (ctx.mission)
			ctx.addEdge({ from: `mission:${ctx.mission.id}`, to: proofId, kind: "verifies", label: "proof-loop" });

		for (const [index, command] of proof.quickPath.slice(0, 10).entries()) {
			const commandId = `command:proof-loop:${ctx.slug(proofBase)}:quick:${index + 1}`;
			ctx.addNode({
				id: commandId,
				kind: "command",
				label: ctx.truncateMiddle(command, 160),
				status: "quick_path",
				note: "proof-loop quick path",
			});
			ctx.addTask({
				id: commandId,
				parentId: proofId,
				kind: "command",
				label: ctx.truncateMiddle(command, 180),
				status: "quick_path",
				command,
			});
			ctx.addEdge({ from: proofId, to: commandId, kind: "suggests", label: "quick_path" });
		}

		appendProofLoopRuntimeSections(ctx, { path, proof, proofBase, proofId });
		appendProofLoopGapSections(ctx, { path, proof, proofBase, proofId });
	}
}
