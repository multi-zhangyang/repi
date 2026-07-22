import type { ExtensionAPI } from "../../../extensions/types.ts";
import { isRepiFullSurface } from "../lean-surface.ts";
import { registerRepiControlCoreTools } from "./tools-core.ts";
import type { ControlPlaneToolDeps } from "./tools-deps.ts";
import { registerRepiControlLaneGraphTools } from "./tools-lane-graph.ts";
import { registerRepiControlNarrativeTools } from "./tools-narrative.ts";

export type { ControlPlaneToolDeps } from "./tools-deps.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export function registerRepiControlPlaneTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	// Reverse product: evidence/graph/lane tools must keep reverse proof_exit runtime capture visible to completion/claim gates.
	registerRepiControlCoreTools(registerTool, pi, deps);
	if (isRepiFullSurface()) {
		registerRepiControlNarrativeTools(registerTool, pi, deps);
	}
	registerRepiControlLaneGraphTools(registerTool, pi, deps);
}
