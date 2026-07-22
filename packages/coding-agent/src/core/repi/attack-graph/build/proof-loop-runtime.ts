/** Attack-graph proof-loop runtime closure/step/execution nodes. */
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { appendProofLoopRuntimeClosure } from "./proof-loop-runtime-closure.ts";
import { appendProofLoopRuntimeExecutions } from "./proof-loop-runtime-executions.ts";
import { appendProofLoopRuntimeSteps } from "./proof-loop-runtime-steps.ts";

export function appendProofLoopRuntimeSections(
	ctx: AttackGraphBuildCtx,
	args: { path: string; proof: any; proofBase: string; proofId: string },
): void {
	// Runtime adapter closure + steps + executions for reverse proof-loop evidence.
	appendProofLoopRuntimeClosure(ctx, args);
	appendProofLoopRuntimeSteps(ctx, args);
	appendProofLoopRuntimeExecutions(ctx, args);
}
