/** Narrative surface command registrations (lean-gated control plane). */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiNarrativeControlCommands } from "./commands-control.ts";
import { registerRepiNarrativeReverseCommands } from "./commands-reverse.ts";
import type { CommandRegistrar, NarrativeToolDeps } from "./types.ts";

export function registerRepiNarrativeCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	// Reverse: swarm/operator claim remains blocked until runtime capture + bind_ready / proof_exit.
	registerRepiNarrativeReverseCommands(registerCommand, pi, deps);
	registerRepiNarrativeControlCommands(registerCommand, pi, deps);
}
