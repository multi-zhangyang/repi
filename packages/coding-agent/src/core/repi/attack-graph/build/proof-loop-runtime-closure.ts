/** Attack-graph proof-loop runtime nodes. */

import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendProofLoopRuntimeClosure(
	ctx: AttackGraphBuildCtx,
	args: { path: string; proof: any; proofBase: string; proofId: string },
): void {
	const { path, proof, proofBase, proofId } = args;
	for (const [index, row] of proof.runtimeAdapterClosure.slice(0, 12).entries()) {
		const adapterId = /\badapter=([^\s]+)/.exec(row)?.[1] ?? `adapter-${index + 1}`;
		const status = /\bstatus=([^\s]+)/.exec(row)?.[1] ?? "unknown";
		const commands = /\bcommands=(.*?)(?:\s+evidence=|$)/.exec(row)?.[1]?.trim() ?? "";
		const closureId = `verify:proof-loop-runtime-closure:${ctx.slug(proofBase)}:${ctx.slug(adapterId)}:${index + 1}`;
		ctx.addNode({
			id: closureId,
			kind: "verification",
			label: `runtime_adapter_closure ${adapterId}`,
			status,
			path,
			note: row,
		});
		ctx.addTask({
			id: closureId,
			parentId: proofId,
			kind: "verification",
			label: `runtime_adapter_closure ${adapterId}`,
			status,
			command: commands && commands !== "<none>" ? commands : undefined,
			path,
			evidence: [row],
		});
		ctx.addEdge({
			from: closureId,
			to: proofId,
			kind: status === "needs_adapter_rerun" ? "blocks" : "verifies",
			label: "runtime-adapter-closure",
		});
	}
}
