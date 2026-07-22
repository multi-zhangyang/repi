/** Goal state guards / completion checks */
import type { AgentStopReason, AssistantMessageLike, RepiGoalState } from "./types.ts";
import {
	CONTEXT_OVERFLOW_RE,
	CONTRADICTORY_COMPLETION_PATTERNS,
	NON_RETRYABLE_GOAL_ERROR_RE,
	RETRYABLE_GOAL_ERROR_RE,
} from "./types.ts";

export function isGoalState(value: unknown): value is RepiGoalState {
	if (!value || typeof value !== "object") return false;
	const goal = value as Partial<RepiGoalState>;
	return (
		typeof goal.id === "string" &&
		typeof goal.text === "string" &&
		["active", "paused", "budget_limited", "complete"].includes(String(goal.status)) &&
		typeof goal.startedAt === "number" &&
		typeof goal.updatedAt === "number" &&
		typeof goal.iteration === "number" &&
		typeof goal.tokensUsed === "number" &&
		typeof goal.timeUsedSeconds === "number" &&
		typeof goal.baselineTokens === "number"
	);
}

export function isContradictoryCompletionSummary(summary: string): boolean {
	return CONTRADICTORY_COMPLETION_PATTERNS.some((pattern: any) => pattern.test(summary));
}

export function isRetryableGoalInterruption(assistant: AssistantMessageLike): boolean {
	if (assistant.stopReason !== "error") return false;
	if (!assistant.errorMessage) return false;
	if (NON_RETRYABLE_GOAL_ERROR_RE.test(assistant.errorMessage)) return false;
	return isGoalContextOverflow(assistant) || RETRYABLE_GOAL_ERROR_RE.test(assistant.errorMessage);
}

export function isGoalContextOverflow(assistant: AssistantMessageLike): boolean {
	return Boolean(assistant.errorMessage && CONTEXT_OVERFLOW_RE.test(assistant.errorMessage));
}

export function isAgentStopReason(value: unknown): value is AgentStopReason {
	return ["stop", "length", "toolUse", "error", "aborted"].includes(String(value));
}
