/** REPI wire bus slice: proof-modules. */
import type { PickFn } from "./wire-pick.ts";
import { wireProofCompletionModules } from "./wire-proof-completion.ts";
import { wireProofRuntimeModules } from "./wire-proof-runtime.ts";

export type { PickFn } from "./wire-pick.ts";

export function wireProofModules(pick: PickFn): void {
	wireProofCompletionModules(pick);
	wireProofRuntimeModules(pick);
}
