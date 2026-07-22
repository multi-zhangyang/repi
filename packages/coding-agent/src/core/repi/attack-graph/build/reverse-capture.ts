/** Attack-graph build section: reverse runtime capture gap. */

import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { AttackGraphBuildCtx } from "./ctx.ts";

export function appendAttackGraphReverseCapture(ctx: AttackGraphBuildCtx): void {
	const reverseCaptureMissing =
		/pending_runtime_capture|bind_ready\s*=\s*false|proof_exit\s*=\s*pending|reverse_proof_exit_missing|require_proof_exit_before_claim/i.test(
			[
				JSON.stringify(ctx.mission ?? {}),
				JSON.stringify(ctx.map ?? {}),
				JSON.stringify(ctx.runtimeAdapterArtifacts ?? []),
				JSON.stringify(ctx.proofLoopArtifacts ?? []),
				JSON.stringify(ctx.swarmArtifacts ?? []),
			].join("\n"),
		);
	if (reverseCaptureMissing) {
		const reverseBlob = [
			JSON.stringify(ctx.mission ?? {}),
			JSON.stringify(ctx.map ?? {}),
			JSON.stringify(ctx.runtimeAdapterArtifacts ?? []),
			JSON.stringify(ctx.proofLoopArtifacts ?? []),
			JSON.stringify(ctx.swarmArtifacts ?? []),
		].join("\n");
		const target = (ctx.map as any)?.target ?? (ctx.mission as any)?.target ?? undefined;
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: reverseBlob,
			target,
			includeGates: true,
		});
		ctx.gaps.push("reverse runtime proof_exit capture missing or bind_ready=false");
		ctx.addNode({
			id: "gap:reverse-runtime-capture",
			kind: "gap",
			label: "reverse runtime proof_exit capture missing",
			status: "blocked",
			priority: 1,
			note: "require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true",
		});
		ctx.addTask({
			id: "task:reverse-runtime-capture",
			kind: "next",
			label: "Capture reverse runtime proof_exit",
			status: "ready",
			command: reverseNext.join(" && "),
			evidence: ["query.proof_exit", "bind_ready", "reverse_runtime_capture"],
			note: "catalog technique.proofExit alone is insufficient; domain-aware runtime runners required",
		});
	}
}
