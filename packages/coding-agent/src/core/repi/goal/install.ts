/** installRepiGoalMode wiring. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { registerRepiGoalCommand } from "./install-command.ts";
import { installRepiGoalHooks } from "./install-hooks.ts";
import { registerRepiGoalCompleteTool } from "./install-tool.ts";
import type { RepiGoalRuntime } from "./types.ts";

export function installRepiGoalMode(pi: ExtensionAPI): void {
	const runtime: RepiGoalRuntime = {
		staleGoalToolCallsBlocked: false,
		cancelledContinuationMarkers: new Set<string>(),
		recoveryAttempts: new Map<string, number>(),
	};

	registerRepiGoalCompleteTool(pi, runtime);
	registerRepiGoalCommand(pi, runtime);
	installRepiGoalHooks(pi, runtime);
}
