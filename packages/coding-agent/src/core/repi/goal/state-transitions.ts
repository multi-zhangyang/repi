/** Goal state transitions / budget / usage */

import { currentTokenTotal } from "./format.ts";
import type { RepiGoalContext, RepiGoalState, RepiGoalStatus } from "./types.ts";

export function transitionGoal(goal: RepiGoalState, status: RepiGoalStatus): RepiGoalState {
	return normalizeGoalForBudget({ ...goal, status, updatedAt: Date.now() });
}

export function normalizeGoalForBudget(goal: RepiGoalState): RepiGoalState {
	if (goal.status === "active" && goal.tokenBudget !== undefined && goal.tokensUsed >= goal.tokenBudget) {
		return { ...goal, status: "budget_limited" };
	}
	return goal;
}

export function incrementGoal(goal: RepiGoalState): RepiGoalState {
	return { ...goal, iteration: goal.iteration + 1, updatedAt: Date.now() };
}

export function editedGoalStatus(status: RepiGoalStatus): RepiGoalStatus {
	return status === "paused" ? "paused" : "active";
}

export function updateGoalUsage(goal: RepiGoalState, ctx: RepiGoalContext): void {
	goal.tokensUsed = Math.max(0, currentTokenTotal(ctx) - goal.baselineTokens);
	goal.timeUsedSeconds = Math.max(0, Math.floor((Date.now() - goal.startedAt) / 1000));
	goal.updatedAt = Date.now();
}
