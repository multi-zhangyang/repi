/** Goal pause/resume/clear controls. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { formatBudget } from "./format.ts";
import {
	abortCurrentTurn,
	blockStaleGoalToolCalls,
	cancelContinuationPending,
	clearActiveGoal,
	clearGoalRecovery,
	clearStaleGoalToolCallBlock,
	persistClearedGoal,
	persistGoal,
	transitionGoal,
	updateStatus,
} from "./state.ts";
import { sendResumePrompt } from "./state-prompts.ts";
import type { RepiGoalContext, RepiGoalRuntime } from "./types.ts";
import { STATUS_KEY } from "./types.ts";

export function pauseGoal(pi: ExtensionAPI, runtime: RepiGoalRuntime, ctx: RepiGoalContext): void {
	if (!runtime.activeGoal) {
		ctx.ui.notify("No active goal.", "info");
		return;
	}
	if (runtime.activeGoal.status !== "active") {
		ctx.ui.notify(`Goal is ${runtime.activeGoal.status}; only active goals can be paused.`, "warning");
		return;
	}
	cancelContinuationPending(runtime);
	blockStaleGoalToolCalls(runtime);
	abortCurrentTurn(ctx);
	runtime.activeGoal = transitionGoal(runtime.activeGoal, "paused");
	persistGoal(pi, runtime.activeGoal);
	updateStatus(runtime, ctx, runtime.activeGoal);
	ctx.ui.notify(`Goal paused: ${runtime.activeGoal.text}`, "info");
}

export async function resumeGoal(pi: ExtensionAPI, runtime: RepiGoalRuntime, ctx: RepiGoalContext): Promise<void> {
	if (!runtime.activeGoal) {
		ctx.ui.notify("No active goal.", "info");
		return;
	}
	if (runtime.activeGoal.status !== "paused" && runtime.activeGoal.status !== "budget_limited") {
		ctx.ui.notify(
			`Goal is ${runtime.activeGoal.status}; only paused or budget-limited goals can be resumed.`,
			"warning",
		);
		return;
	}
	clearGoalRecovery(runtime);
	clearStaleGoalToolCallBlock(runtime);
	runtime.activeGoal = transitionGoal(runtime.activeGoal, "active");
	persistGoal(pi, runtime.activeGoal);
	updateStatus(runtime, ctx, runtime.activeGoal);
	if (runtime.activeGoal.status !== "active") {
		ctx.ui.notify(`Goal token budget is still reached: ${formatBudget(runtime.activeGoal)}`, "warning");
		return;
	}
	ctx.ui.notify(`Goal resumed: ${runtime.activeGoal.text}`, "info");
	await sendResumePrompt(pi, runtime, ctx, runtime.activeGoal);
}

export function clearGoal(pi: ExtensionAPI, runtime: RepiGoalRuntime, ctx: RepiGoalContext): void {
	if (!runtime.activeGoal) {
		ctx.ui.notify("No active goal.", "info");
		cancelContinuationPending(runtime);
		clearGoalRecovery(runtime);
		persistClearedGoal(pi);
		ctx.ui.setStatus(STATUS_KEY, undefined);
		return;
	}
	const stoppedGoal = runtime.activeGoal.text;
	clearActiveGoal(pi, runtime, ctx);
	ctx.ui.notify(`Goal cleared: ${stoppedGoal}`, "warning");
}
