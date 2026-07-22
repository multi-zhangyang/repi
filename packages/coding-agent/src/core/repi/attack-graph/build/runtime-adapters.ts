/** Attack-graph build section: runtime adapter artifacts. */
import type { AttackGraphBuildCtx } from "./ctx.ts";
import { appendAttackGraphRuntimeAdapterArtifacts } from "./runtime-adapters-artifacts.ts";

export function appendAttackGraphRuntimeAdapters(ctx: AttackGraphBuildCtx): void {
	appendAttackGraphRuntimeAdapterArtifacts(ctx);
}
