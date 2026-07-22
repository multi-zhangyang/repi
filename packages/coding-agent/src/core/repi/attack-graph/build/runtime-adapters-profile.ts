/** Runtime-adapter target-profile graph nodes. */
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendRuntimeAdapterTargetProfileNodes(
	ctx: AttackGraphBuildCtx,
	params: {
		adapterId: string;
		targetProfile: any;
		targetProfileId: string;
		artifact: any;
	},
): void {
	const { adapterId, targetProfile, targetProfileId, artifact } = params;
	if (!targetProfile) return;
	ctx.addNode({
		id: targetProfileId,
		kind: "target_profile",
		label: ctx.truncateMiddle(targetProfile.target || artifact.target || "<none>", 160),
		status: `kinds=${targetProfile.targetKinds.join(",")} exists=${targetProfile.exists}`,
		note: [
			`path=${targetProfile.pathKind ?? "<none>"}`,
			`magic=${targetProfile.magic ?? "<none>"}`,
			`adapters=${targetProfile.adapterIds.join(",") || "<none>"}`,
			`reasons=${targetProfile.reasons.join(" | ") || "<none>"}`,
		].join(" "),
	});
	ctx.addTask({
		id: targetProfileId,
		parentId: adapterId,
		kind: "target_profile",
		label: ctx.truncateMiddle(targetProfile.target || artifact.target || "<none>", 180),
		status: `kinds=${targetProfile.targetKinds.join(",")} exists=${targetProfile.exists}`,
		evidence: targetProfile.signals
			.slice(0, 8)
			.map(
				(signal: any) =>
					`rank=${signal.evidenceRank} kind=${signal.targetKind} adapter=${signal.adapterId} reason=${signal.reason}`,
			),
		note: `runtime target profile magic=${targetProfile.magic ?? "<none>"}`,
	});
	ctx.addEdge({ from: targetProfileId, to: adapterId, kind: "supports", label: "target-profile-auto-detect" });
}
