/** Register REPI verifier/compiler/replayer/autofix/proof_loop tools. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiAutofixTool } from "./tools-proof-autofix.ts";
import { registerRepiCompilerTool } from "./tools-proof-compiler.ts";
import { registerRepiProofLoopTool } from "./tools-proof-proof_loop.ts";
import { registerRepiReplayerTool } from "./tools-proof-replayer.ts";
import { registerRepiVerifierTool } from "./tools-proof-verifier.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiProofChainTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	// reverse: proof-chain tools close runtime proof_exit via verifier/compiler/replayer/autofix/proof_loop
	registerRepiVerifierTool(registerTool, pi, deps);
	registerRepiCompilerTool(registerTool, pi, deps);
	registerRepiReplayerTool(registerTool, pi, deps);
	registerRepiAutofixTool(registerTool, pi, deps);
	registerRepiProofLoopTool(registerTool, pi, deps);
}
