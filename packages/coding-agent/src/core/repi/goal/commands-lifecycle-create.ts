/** Goal create + auto-pause after agent end. */
import { randomUUID } from "node:crypto";
import type { ExtensionAPI } from "../../extensions/types.ts";
import { truncateNotification } from "./format.ts";
import {
	abortCurrentTurn,
	blockStaleGoalToolCalls,
	cancelContinuationPending,
	persistGoal,
	transitionGoal,
	updateStatus,
} from "./state.ts";
import type { AssistantMessageLike, RepiGoalContext, RepiGoalRuntime, RepiGoalState } from "./types.ts";

export function pauseGoalAfterAgentEnd(
	pi: ExtensionAPI,
	runtime: RepiGoalRuntime,
	ctx: RepiGoalContext,
	goal: RepiGoalState,
	assistant: AssistantMessageLike | undefined,
): void {
	cancelContinuationPending(runtime);
	blockStaleGoalToolCalls(runtime);
	abortCurrentTurn(ctx);
	runtime.activeGoal = transitionGoal(goal, "paused");
	persistGoal(pi, runtime.activeGoal);
	updateStatus(runtime, ctx, runtime.activeGoal);

	const reason = assistant?.stopReason === "aborted" ? "interruption" : "agent error";
	const details = assistant?.errorMessage ? ` (${truncateNotification(assistant.errorMessage)})` : "";
	ctx.ui.notify(`Goal paused after ${reason}${details}. Run /goal resume to continue.`, "warning");
}

export function createGoal(text: string, tokenBudget: number | undefined, baselineTokens: number): RepiGoalState {
	const now = Date.now();
	return {
		id: randomUUID(),
		text,
		status: "active",
		startedAt: now,
		updatedAt: now,
		iteration: 0,
		tokenBudget,
		tokensUsed: 0,
		timeUsedSeconds: 0,
		baselineTokens,
	};
}
