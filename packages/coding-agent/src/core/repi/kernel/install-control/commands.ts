/** Control-plane install surface: commands. */
/**
 * Control-plane tool registration (route/mission/lane/map/evidence/graph/kernel/decision).
 * Builders stay in profile-runtime; this module only registers tools via DI.
 */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { isRepiFullSurface } from "../lean-surface.ts";
import { registerRepiControlPlaneFullCommands } from "./commands-full.ts";
import { registerRepiControlPlaneLeanCommands } from "./commands-lean.ts";
import type { CommandRegistrar, ControlPlaneToolDeps } from "./commands-types.ts";

export type { CommandRegistrar, ControlPlaneToolDeps, ToolRegistrar } from "./commands-types.ts";

export function registerRepiControlPlaneCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	// Prefer reverse proof-exit commands when reverse_kind/native/mobile/web capture is open.
	registerRepiControlPlaneLeanCommands(registerCommand, pi, deps);
	if (isRepiFullSurface()) {
		registerRepiControlPlaneFullCommands(registerCommand, pi, deps);
	}
}
