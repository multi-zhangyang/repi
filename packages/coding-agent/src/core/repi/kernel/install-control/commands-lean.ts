/** Lean control-plane commands (always registered). */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiControlPlaneLeanLaneCommands } from "./commands-lean-lane.ts";
import { registerRepiControlPlaneLeanMapEvidenceCommands } from "./commands-lean-map-evidence.ts";
import { registerRepiControlPlaneLeanRouteMissionCommands } from "./commands-lean-route-mission.ts";
import type { CommandRegistrar, ControlPlaneToolDeps } from "./commands-types.ts";

export function registerRepiControlPlaneLeanCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerRepiControlPlaneLeanRouteMissionCommands(registerCommand, pi, deps);
	registerRepiControlPlaneLeanLaneCommands(registerCommand, pi, deps);
	registerRepiControlPlaneLeanMapEvidenceCommands(registerCommand, pi, deps);
}
