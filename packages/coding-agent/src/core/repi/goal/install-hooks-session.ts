import type { ExtensionAPI, InputEvent, ToolCallEventResult } from "../../extensions/types.ts";
import {
	cancelContinuationPending,
	clearCompletionStatusTimer,
	clearContinuationTracking,
	clearGoalRecovery,
	clearGoalRecoveryForGoal,
	clearStaleGoalToolCallBlock,
	consumeCancelledContinuationPrompt,
	loadGoalFromSession,
	persistGoal,
	sendContinuationPrompt,
	updateGoalUsage,
	updateStatus,
} from "./state.ts";
import type { RepiGoalRuntime } from "./types.ts";
import { STATUS_KEY } from "./types.ts";

export function installRepiGoalSessionHooks(pi: ExtensionAPI, runtime: RepiGoalRuntime): void {
	pi.on("session_start", (_event: any, ctx: any) => {
		clearCompletionStatusTimer(runtime);
		clearContinuationTracking(runtime);
		clearGoalRecovery(runtime);
		clearStaleGoalToolCallBlock(runtime);
		runtime.recoveryAttempts.clear();
		runtime.activeGoal = loadGoalFromSession(ctx);
		if (runtime.activeGoal) updateStatus(runtime, ctx, runtime.activeGoal);
		else ctx.ui.setStatus(STATUS_KEY, undefined);
	});

	pi.on("session_shutdown", (_event: any, ctx: any) => {
		if (runtime.activeGoal) persistGoal(pi, runtime.activeGoal);
		clearContinuationTracking(runtime);
		clearGoalRecovery(runtime);
		clearStaleGoalToolCallBlock(runtime);
		ctx.ui.setStatus(STATUS_KEY, undefined);
		clearCompletionStatusTimer(runtime);
	});

	pi.on("session_before_compact", (_event: any, ctx: any) => {
		if (!runtime.activeGoal || runtime.activeGoal.status !== "active") return;
		updateGoalUsage(runtime.activeGoal, ctx);
		cancelContinuationPending(runtime);
		persistGoal(pi, runtime.activeGoal);
		updateStatus(runtime, ctx, runtime.activeGoal);
	});

	pi.on("session_compact", async (_event: any, ctx: any) => {
		if (!runtime.activeGoal || runtime.activeGoal.status !== "active") {
			clearGoalRecovery(runtime);
			return;
		}
		const restoredGoal = loadGoalFromSession(ctx);
		if (restoredGoal?.id === runtime.activeGoal.id) runtime.activeGoal = restoredGoal;
		updateGoalUsage(runtime.activeGoal, ctx);
		persistGoal(pi, runtime.activeGoal);
		updateStatus(runtime, ctx, runtime.activeGoal);
		clearGoalRecoveryForGoal(runtime, runtime.activeGoal.id);
		if (ctx.hasPendingMessages()) return;
		await sendContinuationPrompt(pi, runtime, ctx, runtime.activeGoal);
	});

	pi.on("input", (event: InputEvent) => {
		if (event.source === "extension") {
			if (consumeCancelledContinuationPrompt(runtime, event.text)) return { action: "handled" as const };
			return;
		}
		clearGoalRecovery(runtime);
		clearStaleGoalToolCallBlock(runtime);
	});

	pi.on("tool_call", (): ToolCallEventResult | undefined => {
		if (!runtime.staleGoalToolCallsBlocked) return undefined;
		return {
			block: true,
			reason: "Blocked stale /goal tool call after the goal was paused, cleared, or interrupted.",
		};
	});
}
