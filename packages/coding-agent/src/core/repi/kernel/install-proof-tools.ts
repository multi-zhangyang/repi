/**
 * Proof/bootstrap/complete/tool-index tool registration.
 * Implementation under ./install-proof-tools/*.
 */

export { registerRepiProofLoopCommands } from "./install-proof-tools/commands.ts";
export { registerRepiProofLoopTools } from "./install-proof-tools/tools.ts";
export type {
	CommandRegistrar,
	ProofLoopToolDeps,
	ToolRegistrar,
} from "./install-proof-tools/types.ts";
