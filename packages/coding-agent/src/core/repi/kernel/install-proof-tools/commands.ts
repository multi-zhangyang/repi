/** Register REPI proof/bootstrap/complete slash commands. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiProofBootstrapCommands } from "./commands-bootstrap.ts";
import { registerRepiProofChainCommands } from "./commands-proof.ts";
import type { CommandRegistrar, ProofLoopToolDeps } from "./types.ts";

/** reverse: proof commands surface capture gates for reverse-heavy missions */
export function registerRepiProofLoopCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	registerRepiProofChainCommands(registerCommand, pi, deps);
	registerRepiProofBootstrapCommands(registerCommand, pi, deps);
}
