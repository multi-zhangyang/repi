/** Attack-graph runtime adapter artifact nodes/edges. */
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { runtimeAdapterArtifactIds } from "./runtime-adapters-ids.ts";
import { appendRuntimeAdapterCoreNodes } from "./runtime-adapters-nodes.ts";
import { appendRuntimeAdapterProofSection } from "./runtime-adapters-proof.ts";
import { appendRuntimeAdapterStreamOutputs } from "./runtime-adapters-streams.ts";

export function appendAttackGraphRuntimeAdapterArtifacts(ctx: AttackGraphBuildCtx): void {
	for (const { path, artifact } of ctx.runtimeAdapterArtifacts) {
		ctx.sourceArtifacts.push(path);
		const ids = runtimeAdapterArtifactIds(ctx, path, artifact);
		appendRuntimeAdapterCoreNodes(ctx, {
			path,
			artifact,
			artifactBase: ids.artifactBase,
			adapterId: ids.adapterId,
			artifactId: ids.artifactId,
			commandId: ids.commandId,
			parserMatchCount: ids.parserMatchCount,
			targetProfile: ids.targetProfile,
			targetProfileId: ids.targetProfileId,
		});
		appendRuntimeAdapterStreamOutputs(ctx, {
			path,
			artifact,
			artifactId: ids.artifactId,
			artifactBase: ids.artifactBase,
			commandId: ids.commandId,
		});
		// Reverse/runtime proof-exit section (bind proof signals + reverse next).
		appendRuntimeAdapterProofSection(ctx, {
			path,
			artifact,
			artifactId: ids.artifactId,
			artifactBase: ids.artifactBase,
			adapterId: artifact.adapterId,
			parserSummaryId: ids.parserSummaryId,
			parserSummary: ids.parserSummary,
			parserMatchCount: ids.parserMatchCount,
			mitigationId: ids.mitigationId,
			mitigationEvidence: ids.mitigationEvidence,
			targetProfile: ids.targetProfile,
			targetProfileId: ids.targetProfileId,
		});
	}
}
