/**
 * Operator plan/write/show/classify/dispatch surface.
 * Implementation under ./operator-runtime/*.
 */

export {
	buildOperator,
	buildOperatorOutput,
	latestOperatorArtifactPath,
	latestOrBuildOperator,
	operatorFeedbackCategory,
	operatorFeedbackRow,
	operatorFeedbackToolHint,
	parseOperatorArtifact,
	parseShellQuotedValue,
	writeOperatorArtifact,
} from "./operator-runtime/core.ts";
export type { OperatorRuntimeDeps } from "./operator-runtime/deps.ts";
export { configureOperatorRuntime, d } from "./operator-runtime/deps.ts";
export {
	autonomousExecutionBudget,
	commanderBudgetValue,
	commanderPolicyFromContext,
	dispatcherAdaptiveRoutingHints,
	dispatcherFeedbackExecutionStatus,
	dispatcherFeedbackParsedRows,
	dispatcherFeedbackScoreboard,
	dispatcherLearningHints,
	dispatchOperatorQueue,
	isCommanderRuntimeCommand,
	latestDispatcherFeedbackBoard,
	parseDispatcherFeedbackRow,
	parseWorkerScoreboardLine,
	workerAdaptiveRoutingHints,
	writeDispatcherFeedbackBoard,
} from "./operator-runtime/dispatch.ts";
export {
	bootstrapToolFromCommand,
	classifyOperatorFeedback,
	latestOperatorFeedback,
	operatorCommandConcrete,
	operatorEscalationQueue,
	operatorFeedbackDispatcherCommands,
	operatorFeedbackDispatchPlan,
	operatorFeedbackFallbackCommands,
	operatorFeedbackNextCommands,
	operatorFeedbackPriority,
	operatorStepPriority,
	operatorVerificationLines,
} from "./operator-runtime/feedback.ts";
export type {
	DispatcherFeedbackParsedRow,
	OperatorArtifact,
} from "./operator-runtime/types.ts";
