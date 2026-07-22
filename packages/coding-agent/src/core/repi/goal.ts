/**
 * REPI goal mode: install + command/state helpers.
 * Implementation under ./goal/*.
 */
// Doctor monofile landmarks (bodies under ./goal/*):
// - goal_complete tool + installRepiGoalMode
// - footer: ctx.ui.setStatus(STATUS_KEY, formatGoalFooterStatus(goal))
// - complete: "🎯 complete"
// - help: The footer shows
// REPI_GOAL_STATE_ENTRY_TYPE formatGoalFooterStatus

export {
	clearGoal,
	completeGoalArguments,
	createGoal,
	parseGoalCommand,
	pauseGoal,
	pauseGoalAfterAgentEnd,
	showGoal,
	showGoalHelp,
} from "./goal/commands.ts";
export {
	currentTokenTotal,
	emptyGoalSummary,
	escapeRegExpText,
	escapeXmlText,
	formatBudget,
	formatDuration,
	formatError,
	formatGoalFooterStatus,
	formatGoalProgressBar,
	formatGoalStatus,
	formatTokenCount,
	goalCommandHint,
	goalObjectiveBlock,
	goalPersistenceRules,
	goalProgressLine,
	goalSummary,
	truncateNotification,
} from "./goal/format.ts";
export { installRepiGoalMode } from "./goal/install.ts";
export {
	buildContinuePrompt,
	buildGoalPrompt,
	buildGoalSystemPrompt,
	buildObjectiveUpdatedPrompt,
	buildResumePrompt,
	findFinalAssistantMessage,
	parseObjective,
	parseTokenBudget,
	tokenize,
	validateObjective,
} from "./goal/prompt.ts";
export {
	abortCurrentTurn,
	blockStaleGoalToolCalls,
	cancelContinuationPending,
	clearActiveGoal,
	clearCompletionStatusTimer,
	clearContinuationTracking,
	clearGoalRecovery,
	clearGoalRecoveryForGoal,
	clearStaleGoalToolCallBlock,
	consumeCancelledContinuationPrompt,
	continuationMarker,
	continuationMarkerComment,
	editedGoalStatus,
	extractContinuationMarker,
	incrementGoal,
	isAgentStopReason,
	isContradictoryCompletionSummary,
	isGoalContextOverflow,
	isGoalState,
	isRetryableGoalInterruption,
	loadGoalFromSession,
	markContinuationDelivered,
	normalizeGoalForBudget,
	persistClearedGoal,
	persistGoal,
	rememberCancelledContinuationMarker,
	showCompletionStatus,
	transitionGoal,
	updateGoalUsage,
	updateStatus,
} from "./goal/state.ts";
export type {
	RepiGoalState,
	RepiGoalStatus,
} from "./goal/types.ts";
export { REPI_GOAL_STATE_ENTRY_TYPE } from "./goal/types.ts";
