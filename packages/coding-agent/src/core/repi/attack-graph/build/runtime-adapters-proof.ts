/** Attack-graph runtime-adapter mitigation/parser/gap helpers. */
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { appendRuntimeAdapterMissingProofGaps } from "./runtime-adapters-proof-gaps.ts";
import {
	appendRuntimeAdapterMitigationAndParser,
	appendRuntimeAdapterParserSignals,
} from "./runtime-adapters-proof-nodes.ts";

export function appendRuntimeAdapterProofSection(
	ctx: AttackGraphBuildCtx,
	args: {
		path: string;
		artifact: any;
		artifactId: string;
		artifactBase: string;
		adapterId: string;
		parserSummaryId: string;
		parserSummary: any;
		parserMatchCount: number;
		mitigationId: string;
		mitigationEvidence: any;
		targetProfile: any;
		targetProfileId: string;
	},
): void {
	const {
		path,
		artifact,
		artifactId,
		artifactBase,
		adapterId,
		parserSummaryId,
		parserSummary,
		parserMatchCount,
		mitigationId,
		mitigationEvidence,
		targetProfile,
		targetProfileId,
	} = args;
	if (targetProfile)
		ctx.addEdge({ from: targetProfileId, to: artifactId, kind: "evidences", label: "target-profile" });
	appendRuntimeAdapterMitigationAndParser({
		ctx,
		path,
		artifact,
		artifactId,
		parserSummaryId,
		parserSummary,
		mitigationId,
		mitigationEvidence,
	});
	appendRuntimeAdapterMissingProofGaps(ctx, {
		path,
		artifact,
		adapterId,
		parserSummaryId,
		parserSummary,
		artifactBase,
	});
	if (ctx.mission)
		ctx.addEdge({ from: `mission:${ctx.mission.id}`, to: adapterId, kind: "requires", label: "runtime-adapter" });
	appendRuntimeAdapterParserSignals({
		ctx,
		artifact,
		artifactId,
		artifactBase,
		parserSummaryId,
	});
	if (artifact.killed || (artifact.exitCode !== null && artifact.exitCode !== 0)) {
		ctx.gaps.push(
			`runtime adapter failed: ${artifact.adapterId} exit=${artifact.exitCode ?? "null"} killed=${artifact.killed}`,
		);
	}
	if (parserMatchCount === 0) ctx.gaps.push(`runtime adapter parser no-match: ${artifact.adapterId}`);
}
