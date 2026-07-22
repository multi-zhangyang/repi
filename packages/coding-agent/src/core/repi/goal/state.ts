/** Goal state transitions and session persistence. */

export {
	cancelContinuationPending,
	clearContinuationTracking,
	consumeCancelledContinuationPrompt,
	continuationMarker,
	continuationMarkerComment,
	extractContinuationMarker,
	markContinuationDelivered,
	rememberCancelledContinuationMarker,
} from "./state-continuation.ts";
export {
	isAgentStopReason,
	isContradictoryCompletionSummary,
	isGoalContextOverflow,
	isGoalState,
	isRetryableGoalInterruption,
} from "./state-guards.ts";
export {
	clearActiveGoal,
	loadGoalFromSession,
	persistClearedGoal,
	persistGoal,
} from "./state-persist.ts";
export {
	sendContinuationPrompt,
	sendGoalPrompt,
	sendObjectiveUpdatedPrompt,
	sendResumePrompt,
} from "./state-prompts.ts";
export {
	abortCurrentTurn,
	blockStaleGoalToolCalls,
	clearGoalRecovery,
	clearGoalRecoveryForGoal,
	clearStaleGoalToolCallBlock,
} from "./state-recovery.ts";
export {
	clearCompletionStatusTimer,
	showCompletionStatus,
	updateStatus,
} from "./state-status.ts";
export {
	editedGoalStatus,
	incrementGoal,
	normalizeGoalForBudget,
	transitionGoal,
	updateGoalUsage,
} from "./state-transitions.ts";
