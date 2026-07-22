/** Attack-graph proof-loop gap classifier + reverse next. */

import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendProofLoopGapSections(
	ctx: AttackGraphBuildCtx,
	args: { path: string; proof: any; proofBase: string; proofId: string },
): void {
	const { path, proof, proofBase, proofId } = args;
	for (const [index, row] of proof.gapClassifier.slice(0, 10).entries()) {
		const gapId = `gap:proof-loop:${ctx.slug(proofBase)}:${index + 1}`;
		ctx.addNode({
			id: gapId,
			kind: "gap",
			label: ctx.truncateMiddle(row, 160),
			status: "proof-loop-gap",
			note: row,
		});
		ctx.addTask({
			id: gapId,
			parentId: proofId,
			kind: "gap",
			label: ctx.truncateMiddle(row, 180),
			status: "proof-loop-gap",
			evidence: [path],
		});
		ctx.addEdge({ from: gapId, to: proofId, kind: "blocks", label: "gap_classifier" });
		ctx.gaps.push(`proof loop gap: ${ctx.truncateMiddle(row, 180)}`);
	}
	if (proof.verdict !== "ready") {
		ctx.gaps.push(`proof loop verdict ${proof.verdict}: ${path}`);
		const reverseOpen = /pending_runtime_capture|bind_ready|proof_exit|reverse_proof|technique/i.test(
			JSON.stringify(proof ?? {}),
		);
		if (reverseOpen) {
			const reverseNext = reverseDomainCaptureNextCommands({
				routeOrBlob: `${proof.verdict} ${JSON.stringify(proof.gapClassifier ?? []).slice(0, 400)}`,
				target: (proof as any).target,
			}).slice(0, 3);
			for (const cmd of reverseNext) ctx.gaps.push(`reverse_next: ${cmd}`);
		}
	}
}
