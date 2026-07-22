/** Goal mode types and constants. */

import type { AutocompleteItem } from "@pi-recon/repi-tui";
import type { ExtensionContext } from "../../extensions/types.ts";
export type RepiGoalStatus = "active" | "paused" | "budget_limited" | "complete";
export type AgentStopReason = "stop" | "length" | "toolUse" | "error" | "aborted";
export type GoalRecoveryKind = "provider_retry" | "compaction_retry";

export interface RepiGoalState {
	id: string;
	text: string;
	status: RepiGoalStatus;
	startedAt: number;
	updatedAt: number;
	iteration: number;
	tokenBudget?: number;
	tokensUsed: number;
	timeUsedSeconds: number;
	baselineTokens: number;
}

export interface RepiGoalEntryData {
	version?: 1;
	goal?: RepiGoalState | null;
}

export interface RepiGoalCommandResult {
	kind: "show" | "help" | "start" | "pause" | "resume" | "clear" | "edit";
	objective?: string;
	tokenBudget?: number;
}

export interface ContinuationPending {
	goalId: string;
	iteration: number;
	marker: string;
	prompt: string;
}

export interface GoalRecovery {
	goalId: string;
	kind: GoalRecoveryKind;
}

export interface AssistantMessageLike {
	role: "assistant";
	stopReason?: AgentStopReason;
	errorMessage?: string;
	usage?: unknown;
}

export interface RepiGoalRuntime {
	activeGoal?: RepiGoalState;
	completionStatusTimer?: ReturnType<typeof setTimeout>;
	continuationPending?: ContinuationPending;
	goalRecovery?: GoalRecovery;
	staleGoalToolCallsBlocked: boolean;
	cancelledContinuationMarkers: Set<string>;
	recoveryAttempts: Map<string, number>;
}

export interface GoalCompleteDetails {
	goal: string;
	summary: string;
	status: "accepted" | "rejected";
	reason?: string;
}

export type RepiGoalContext = Pick<
	ExtensionContext,
	"ui" | "mode" | "hasUI" | "cwd" | "sessionManager" | "isIdle" | "hasPendingMessages" | "abort" | "compact" | "model"
>;

export const STATUS_KEY = "goal";
export const REPI_GOAL_STATE_ENTRY_TYPE = "repi-goal-state";
export const LEGACY_PI_GOAL_STATE_ENTRY_TYPE = "goal-state";
export const MAX_OBJECTIVE_LENGTH = 4_000;
export const MAX_CANCELLED_CONTINUATION_PROMPTS = 20;
export const PROVIDER_RETRY_BUDGET = 3;
export const CONTINUATION_MARKER_PREFIX = "repi-goal-continuation:";
export const CONTRADICTORY_COMPLETION_PATTERNS = [
	/(?<!could\s)\bnot\s+(?:yet\s+)?(?:complete|completed|done|finished)\b/i,
	/\bstill\s+(?:incomplete|failing|failing\s+tests?|fails?)\b/i,
	/\btests?\s+(?:still\s+)?fail(?:ing)?\b/i,
	/\bremaining\s+(?:work|tasks?|todo)\b/i,
] as const;
export const NON_RETRYABLE_GOAL_ERROR_RE =
	/usage[_\s-]*limit|chatgpt usage limit|multi-auth rotation failed|credentials tried|unauthori[sz]ed|invalid api key|forbidden|permission denied/i;
export const RETRYABLE_GOAL_ERROR_RE =
	/websocket closed|sse response headers timed out|headers timed out|provider returned error|overloaded|rate.?limit|too many requests|429|500|502|503|504|service unavailable|network|connection|socket|fetch failed|timeout|terminated/i;
export const CONTEXT_OVERFLOW_RE =
	/context[_\s-]*(?:length|window|limit)|input exceeds|maximum context|too many tokens|token limit|reduce the length/i;

export const GOAL_ARGUMENT_COMPLETIONS: readonly AutocompleteItem[] = [
	{ value: "pause", label: "pause", description: "Pause the active REPI goal" },
	{ value: "resume", label: "resume", description: "Resume a paused or budget-limited REPI goal" },
	{ value: "clear", label: "clear", description: "Clear the current REPI goal" },
	{ value: "edit", label: "edit", description: "Edit the current REPI goal objective" },
	{ value: "status", label: "status", description: "Show the current REPI goal" },
	{ value: "--tokens ", label: "--tokens", description: "Set a token budget before the goal" },
];
export const EDIT_TOKEN_COMPLETION: AutocompleteItem = {
	value: "edit --tokens ",
	label: "--tokens",
	description: "Set a token budget before the updated goal",
};
