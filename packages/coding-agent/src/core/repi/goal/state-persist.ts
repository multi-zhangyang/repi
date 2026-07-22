/** Goal session persistence */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { cancelContinuationPending } from "./state-continuation.ts";
import { isGoalState } from "./state-guards.ts";
import { clearGoalRecovery } from "./state-recovery.ts";
import type { RepiGoalContext, RepiGoalEntryData, RepiGoalRuntime, RepiGoalState } from "./types.ts";
import { LEGACY_PI_GOAL_STATE_ENTRY_TYPE, REPI_GOAL_STATE_ENTRY_TYPE, STATUS_KEY } from "./types.ts";

export function persistGoal(pi: ExtensionAPI, goal: RepiGoalState): void {
	pi.appendEntry<RepiGoalEntryData>(REPI_GOAL_STATE_ENTRY_TYPE, { version: 1, goal });
}

export function persistClearedGoal(pi: ExtensionAPI): void {
	pi.appendEntry<RepiGoalEntryData>(REPI_GOAL_STATE_ENTRY_TYPE, { version: 1, goal: null });
}

export function loadGoalFromSession(ctx: RepiGoalContext): RepiGoalState | undefined {
	const branch = ctx.sessionManager.getBranch?.() ?? ctx.sessionManager.getEntries?.() ?? [];
	for (let index = branch.length - 1; index >= 0; index--) {
		const entry = branch[index] as { type?: string; customType?: string; data?: unknown };
		if (entry.type !== "custom") continue;
		if (entry.customType !== REPI_GOAL_STATE_ENTRY_TYPE && entry.customType !== LEGACY_PI_GOAL_STATE_ENTRY_TYPE)
			continue;
		const data = entry.data as RepiGoalEntryData | undefined;
		if (data?.goal === null) return undefined;
		if (isGoalState(data?.goal) && data.goal.status !== "complete") return data.goal;
	}
	return undefined;
}

export function clearActiveGoal(
	pi: ExtensionAPI,
	runtime: RepiGoalRuntime,
	ctx: RepiGoalContext,
	options?: { showStatus?: boolean },
): void {
	cancelContinuationPending(runtime);
	clearGoalRecovery(runtime);
	runtime.activeGoal = undefined;
	persistClearedGoal(pi);
	if (options?.showStatus ?? true) ctx.ui.setStatus(STATUS_KEY, undefined);
}
