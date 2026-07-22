/** Runtime-adapter attack-graph node/task/edge appends. */
// Landmark: appendRuntimeAdapterCoreNodes proof_exit= target-profile runtime-adapter (body in runtime-adapters-artifact.ts)
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { appendRuntimeAdapterArtifactCommandNodes } from "./runtime-adapters-artifact.ts";
import { appendRuntimeAdapterTargetProfileNodes } from "./runtime-adapters-profile.ts";

export function appendRuntimeAdapterCoreNodes(
	ctx: AttackGraphBuildCtx,
	params: {
		path: string;
		artifact: any;
		artifactBase: string;
		adapterId: string;
		artifactId: string;
		commandId: string;
		parserMatchCount: number;
		targetProfile: any;
		targetProfileId: string;
	},
): void {
	const {
		path,
		artifact,
		artifactBase,
		adapterId,
		artifactId,
		commandId,
		parserMatchCount,
		targetProfile,
		targetProfileId,
	} = params;

	ctx.addNode({
		id: adapterId,
		kind: "tool",
		label: artifact.adapterId,
		status: `${artifact.selectedRunner}/${artifact.domainId}`,
		note: `runtime-adapter bridge=${artifact.bridgeId} target=${artifact.target ?? "<none>"}`,
	});
	ctx.addTask({
		id: adapterId,
		parentId: ctx.mission ? `mission:${ctx.mission.id}` : undefined,
		kind: "tool",
		label: artifact.adapterId,
		status: `${artifact.selectedRunner}/${artifact.domainId}`,
		note: `runtime-adapter target=${artifact.target ?? "<none>"}`,
	});

	appendRuntimeAdapterTargetProfileNodes(ctx, {
		adapterId,
		targetProfile,
		targetProfileId,
		artifact,
	});
	appendRuntimeAdapterArtifactCommandNodes(ctx, {
		path,
		artifact,
		artifactBase,
		adapterId,
		artifactId,
		commandId,
		parserMatchCount,
	});
}
