/** Narrative tools group: operator. */
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";
import { registerRepiNarrativeBoardReasonTools } from "./operator-board-reason.ts";
import { registerRepiNarrativeSupervisorReflectTools } from "./operator-supervisor-reflect.ts";

export function registerRepiNarrativeOperatorTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	// Reverse gate: swarm/operator claim paths remain blocked until runtime capture + bind_ready.
	registerRepiNarrativeSupervisorReflectTools(registerTool, pi, deps);
	registerRepiNarrativeBoardReasonTools(registerTool, pi, deps);
}
