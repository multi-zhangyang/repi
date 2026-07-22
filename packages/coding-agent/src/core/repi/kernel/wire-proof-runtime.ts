/** Wire-proof: verifier/compiler/autofix/context-pack configure bag. */
import type { PickFn } from "./wire-pick.ts";
import { wireProofRuntimeContextModules } from "./wire-proof-runtime-context.ts";
import { wireProofRuntimeCoreModules } from "./wire-proof-runtime-core.ts";

export function wireProofRuntimeModules(pick: PickFn): void {
	wireProofRuntimeCoreModules(pick);
	wireProofRuntimeContextModules(pick);
}
