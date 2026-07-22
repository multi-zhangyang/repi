/** Session/agent hooks for REPI goal mode. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { installRepiGoalAgentHooks } from "./install-hooks-agent.ts";
import { installRepiGoalSessionHooks } from "./install-hooks-session.ts";
import type { RepiGoalRuntime } from "./types.ts";

export function installRepiGoalHooks(pi: ExtensionAPI, runtime: RepiGoalRuntime): void {
	// Reverse/pentest goals preserve proof.exit/bind_ready across compact/continue paths.
	installRepiGoalSessionHooks(pi, runtime);
	installRepiGoalAgentHooks(pi, runtime);
}
