/**
 * Control-plane tool registration (route/mission/lane/map/evidence/graph/kernel/decision).
 * Implementation under ./install-control/*.
 */

export { registerRepiControlPlaneCommands } from "./install-control/commands.ts";
export type { ControlPlaneToolDeps } from "./install-control/tools.ts";
export { registerRepiControlPlaneTools } from "./install-control/tools.ts";
