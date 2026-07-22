import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

import { registerRepiNarrativeDelegateTool } from "./swarm-delegate.ts";
import { registerRepiNarrativeSwarmRunTools } from "./swarm-run.ts";

export function registerRepiNarrativeSwarmTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	registerRepiNarrativeDelegateTool(registerTool, pi, deps);
	registerRepiNarrativeSwarmRunTools(registerTool, pi, deps);
}
