/** Lean product control-plane tools: route/mission/map/evidence. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiControlCoreMapEvidenceTools } from "./tools-core-map-evidence.ts";
import { registerRepiControlCoreRouteMissionTools } from "./tools-core-route-mission.ts";
import type { ControlPlaneToolDeps } from "./tools-deps.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export function registerRepiControlCoreTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerRepiControlCoreRouteMissionTools(registerTool, pi, deps);
	registerRepiControlCoreMapEvidenceTools(registerTool, pi, deps);
}
