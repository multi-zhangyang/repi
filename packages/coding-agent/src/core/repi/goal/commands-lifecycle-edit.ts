/** Goal edit control. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { validateObjective } from "./prompt.ts";
import {
	cancelContinuationPending,
	clearGoalRecovery,
	clearStaleGoalToolCallBlock,
	editedGoalStatus,
	normalizeGoalForBudget,
	persistGoal,
	updateGoalUsage,
	updateStatus,
} from "./state.ts";
import { sendObjectiveUpdatedPrompt } from "./state-prompts.ts";
import type { RepiGoalContext, RepiGoalRuntime } from "./types.ts";

export async function editGoal(
	pi: ExtensionAPI,
	runtime: RepiGoalRuntime,
	objective: string,
	tokenBudget: number | undefined,
	ctx: RepiGoalContext,
): Promise<void> {
	const trimmedObjective = objective.trim();
	const validationError = validateObjective(trimmedObjective);
	if (validationError) {
		ctx.ui.notify(validationError, "warning");
		return;
	}
	if (!runtime.activeGoal) {
		ctx.ui.notify("No active goal. Use /goal <objective> to start one.", "warning");
		return;
	}

	updateGoalUsage(runtime.activeGoal, ctx);
	cancelContinuationPending(runtime);
	clearGoalRecovery(runtime);
	runtime.activeGoal = normalizeGoalForBudget({
		...runtime.activeGoal,
		text: trimmedObjective,
		status: editedGoalStatus(runtime.activeGoal.status),
		tokenBudget: tokenBudget ?? runtime.activeGoal.tokenBudget,
		updatedAt: Date.now(),
	});
	persistGoal(pi, runtime.activeGoal);
	updateStatus(runtime, ctx, runtime.activeGoal);
	ctx.ui.notify(`Goal updated: ${trimmedObjective}`, "info");
	if (runtime.activeGoal.status === "active") {
		clearStaleGoalToolCallBlock(runtime);
		await sendObjectiveUpdatedPrompt(pi, runtime, ctx, runtime.activeGoal);
	}
}
