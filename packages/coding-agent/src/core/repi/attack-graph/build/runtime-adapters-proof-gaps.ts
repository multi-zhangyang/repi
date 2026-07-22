/** Runtime-adapter missing proof-exit gap nodes + reverse next. */

import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendRuntimeAdapterMissingProofGaps(
	ctx: AttackGraphBuildCtx,
	args: {
		path: string;
		artifact: any;
		adapterId: string;
		parserSummaryId: string;
		parserSummary: any;
		artifactBase: string;
	},
): void {
	const { path, artifact, adapterId, parserSummaryId, parserSummary, artifactBase } = args;
	if (parserSummary.missingProofExitSignals.length === 0) return;
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `${artifact.adapterId} ${artifact.domainId ?? ""} ${parserSummary.missingProofExitSignals.join(" ")}`,
		target: artifact.target,
		includeGates: true,
	}).slice(0, 3);
	for (const cmd of reverseNext) {
		ctx.gaps.push(`reverse_next: ${cmd}`);
	}
	ctx.gaps.push(
		`runtime adapter missing proof: ${artifact.adapterId}: ${parserSummary.missingProofExitSignals.join("; ")}`,
	);
	for (const missingProofExit of parserSummary.missingProofExitSignals.slice(0, 6)) {
		const gapId = `gap:runtime-adapter:${ctx.slug(artifact.adapterId)}:${ctx.slug(artifactBase)}:${ctx.slug(missingProofExit)}`;
		ctx.addNode({
			id: gapId,
			kind: "gap",
			label: missingProofExit,
			status: "missing-proof-exit",
			note: `adapter=${artifact.adapterId} parser_signal_summary missing_proof=${missingProofExit}`,
		});
		ctx.addTask({
			id: gapId,
			parentId: parserSummaryId,
			kind: "gap",
			label: missingProofExit,
			status: "missing-proof-exit",
			evidence: [`missing_proof=${missingProofExit}`, `adapter=${artifact.adapterId}`, `artifact=${path}`],
		});
		ctx.addEdge({ from: gapId, to: parserSummaryId, kind: "blocks", label: "missing-proof-exit" });
	}
	void adapterId;
}
