/** Register reverse runtime commands. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiReverseBrowserCommands } from "./commands-browser.ts";
import { registerRepiReverseCaptureRuntimeCommands } from "./commands-runtime.ts";
import { registerRepiReverseToolchainCommands } from "./commands-toolchain.ts";
import type { CommandRegistrar, ReverseRuntimeToolDeps } from "./types.ts";

export function registerRepiReverseRuntimeCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	// Reverse commands must drive runtime capture then domain_proof_exit/complete.
	registerRepiReverseBrowserCommands(registerCommand, pi, deps);
	registerRepiReverseCaptureRuntimeCommands(registerCommand, pi, deps);
	registerRepiReverseToolchainCommands(registerCommand, pi, deps);
}
