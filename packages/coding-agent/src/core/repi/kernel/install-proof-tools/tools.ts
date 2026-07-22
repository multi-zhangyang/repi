/** Register REPI proof/bootstrap/complete tools. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiCompleteBootstrapTools } from "./tools-complete.ts";
import { registerRepiIndexTools } from "./tools-index.ts";
import { registerRepiProofChainTools } from "./tools-proof-chain.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiProofLoopTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	registerRepiProofChainTools(registerTool, pi, deps);
	registerRepiCompleteBootstrapTools(registerTool, pi, deps);
	registerRepiIndexTools(registerTool, pi, deps);
}
