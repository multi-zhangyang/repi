/** Goal recovery / stale tool-call guards */
import type { RepiGoalContext, RepiGoalRuntime } from "./types.ts";

export function blockStaleGoalToolCalls(runtime: RepiGoalRuntime): void {
	runtime.staleGoalToolCallsBlocked = true;
}

export function clearStaleGoalToolCallBlock(runtime: RepiGoalRuntime): void {
	runtime.staleGoalToolCallsBlocked = false;
}

export function clearGoalRecovery(runtime: RepiGoalRuntime): void {
	runtime.goalRecovery = undefined;
}

export function clearGoalRecoveryForGoal(runtime: RepiGoalRuntime, goalId: string): void {
	if (runtime.goalRecovery?.goalId === goalId) runtime.goalRecovery = undefined;
}

export function abortCurrentTurn(ctx: RepiGoalContext): void {
	try {
		ctx.abort();
	} catch {
		// Best effort: stale tool-call guard still prevents follow-on work.
	}
}
