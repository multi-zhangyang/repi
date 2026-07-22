/** Install REPI harness/session/commands/tools/goal after bootstrap. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { installRepiGoalMode } from "../goal.ts";
import { installRepiSessionHooks } from "./factory-hooks.ts";
import { installRepiHarnessModes } from "./harness-modes.ts";
import { installReconCommands, installReconTools } from "./install-registrars.ts";
import type { ReconStats } from "./profile-runtime-stats.ts";

export function installRepiExtensionSurface(pi: ExtensionAPI, stats: ReconStats): void {
	// Harness modes first so plan/permission/dynamic tools are available to hooks + route.
	installRepiHarnessModes(pi);
	installRepiSessionHooks(pi, stats);
	installReconCommands(pi, stats);
	installReconTools(pi);
	installRepiGoalMode(pi);
}
