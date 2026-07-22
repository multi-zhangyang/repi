/** Operator format view types and autonomous budget defaults. */

export type OperatorStepFormatView = {
	id: string;
	status: string;
	priority?: string | number;
	command: string;
	reason?: string;
};

export type OperatorExecutionFormatView = {
	stepId: string;
	status: string;
	command: string;
	output: string;
};

export type OperatorFormatView = {
	timestamp: string;
	mode: string;
	missionId?: string;
	route?: string;
	target?: string;
	contextArtifact?: string;
	commanderPolicy: string[];
	compactResumeTelemetry?: string[];
	compactResumeQueue?: string[];
	operatorFeedback?: string[];
	operatorFeedbackQueue?: string[];
	dispatcherFallbackPlan?: string[];
	dispatcherFeedbackScoreboard?: string[];
	dispatcherLearningHints?: string[];
	autonomousBudget?: AutonomousExecutionBudget;
	dispatcherScoreDecay?: string[];
	repeatedFailureDemotions?: string[];
	highScorePromotions?: string[];
	steps: OperatorStepFormatView[];
	executed: OperatorExecutionFormatView[];
	commanderDispatchReport: string[];
	caseMemoryDispatchReport?: string[];
	verification: string[];
	escalationQueue: string[];
	nextActions: string[];
	sourceArtifacts: string[];
	[key: string]: unknown;
};

export type AutonomousExecutionBudget = {
	maxTurns: number;
	maxDispatch: number;
	maxProofLoops: number;
	maxWorkerRetries: number;
	dispatcherBoardPath?: string;
	promotionPlaybookPath?: string;
	ledgerPath?: string;
	formalPlaybookPath?: string;
	scoreDecay: string[];
	historicalScoreDecay: string[];
	demotionRules: string[];
	laneDemotions: string[];
	workerDemotions: string[];
	dispatcherDemotions: string[];
	promotionRules: string[];
	playbookPromotions: string[];
	ledgerRows: string[];
	nextActions: string[];
};

export const EMPTY_AUTONOMOUS_BUDGET: AutonomousExecutionBudget = {
	maxTurns: 0,
	maxDispatch: 0,
	maxProofLoops: 0,
	maxWorkerRetries: 0,
	scoreDecay: [],
	historicalScoreDecay: [],
	demotionRules: [],
	laneDemotions: [],
	workerDemotions: [],
	dispatcherDemotions: [],
	promotionRules: [],
	playbookPromotions: [],
	ledgerRows: [],
	nextActions: [],
};
