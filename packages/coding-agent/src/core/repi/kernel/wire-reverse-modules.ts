/** REPI wire bus slice: reverse-modules. */
import type { PickFn } from "./wire-pick.ts";
import { wireAttackGraphConfigure } from "./wire-reverse-attack-graph.ts";
import { wireExploitChainConfigure } from "./wire-reverse-exploit-chain.ts";
import { wireReverseIoConfigure } from "./wire-reverse-io.ts";
import { wireKnowledgeGraphConfigure } from "./wire-reverse-knowledge-graph.ts";
import { wireProfessionalBridgeConfigure } from "./wire-reverse-professional-bridge.ts";
import { wireRuntimeAdapterExecConfigure } from "./wire-reverse-runtime-adapter.ts";

export function wireReverseModules(pick: PickFn): void {
	wireReverseIoConfigure(pick);
	wireAttackGraphConfigure(pick);
	wireExploitChainConfigure(pick);
	wireKnowledgeGraphConfigure(pick);
	wireRuntimeAdapterExecConfigure(pick);
	wireProfessionalBridgeConfigure(pick);
}
