/** Goal status UI helpers */

import { formatGoalFooterStatus } from "./format.ts";
import type { RepiGoalContext, RepiGoalRuntime, RepiGoalState } from "./types.ts";
import { STATUS_KEY } from "./types.ts";

export function updateStatus(runtime: RepiGoalRuntime, ctx: RepiGoalContext, goal: RepiGoalState): void {
	clearCompletionStatusTimer(runtime);
	ctx.ui.setStatus(STATUS_KEY, formatGoalFooterStatus(goal));
}

export function showCompletionStatus(runtime: RepiGoalRuntime, ctx: RepiGoalContext): void {
	clearCompletionStatusTimer(runtime);
	ctx.ui.setStatus(STATUS_KEY, "🎯 complete");
	const timer = setTimeout(() => {
		runtime.completionStatusTimer = undefined;
		try {
			ctx.ui.setStatus(STATUS_KEY, undefined);
		} catch {
			// Stale UI contexts after reload/session switch are harmless.
		}
	}, 8_000);
	if (typeof timer === "object" && "unref" in timer && typeof timer.unref === "function") timer.unref();
	runtime.completionStatusTimer = timer;
}

export function clearCompletionStatusTimer(runtime: RepiGoalRuntime): void {
	if (!runtime.completionStatusTimer) return;
	clearTimeout(runtime.completionStatusTimer);
	runtime.completionStatusTimer = undefined;
}
