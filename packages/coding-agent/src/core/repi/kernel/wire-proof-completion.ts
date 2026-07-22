/** Wire-proof: completion + proof-loop configure bag. */
import type { PickFn } from "./wire-pick.ts";
import { wireProofCompletionAuditModules } from "./wire-proof-completion-completion-audit.ts";
import { wireProofCompletionLoopModules } from "./wire-proof-completion-proof-loop.ts";
import { wireProofCompletionLoopCoreModules } from "./wire-proof-completion-proof-loop-core.ts";

export function wireProofCompletionModules(pick: PickFn): void {
	wireProofCompletionAuditModules(pick);
	wireProofCompletionLoopModules(pick);
	wireProofCompletionLoopCoreModules(pick);
}
