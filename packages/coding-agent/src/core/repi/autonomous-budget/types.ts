/** Autonomous-budget types. */
export type AutonomousBudgetLedgerSnapshot = {
	path: string;
	turns: number;
	scoreDecay: string[];
	demotions: string[];
	laneDemotions: string[];
	workerDemotions: string[];
	dispatcherDemotions: string[];
	promotions: string[];
	playbookPromotions: string[];
	nextActions: string[];
	rows: string[];
};

export type AutonomousBudgetDeps = {
	[key: string]: any;
	activeLane: (...args: any[]) => any;
	appendEvolution: (...args: any[]) => any;
	appendJournal: (...args: any[]) => any;
	autonomousBudgetLines: (...args: any[]) => any;
	autonomousExecutionBudget: (...args: any[]) => any;
	buildWorkerPromotionQueue: (...args: any[]) => any;
	commandTargetSuffix: (...args: any[]) => any;
	dispatcherFeedbackParsedRows: (...args: any[]) => any;
	latestWorkerScoreboard: (...args: any[]) => any;
	maintainPlaybooks: (...args: any[]) => any;
	readCurrentMission: (...args: any[]) => any;
	shellQuote: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	writeCurrentMission: (...args: any[]) => any;
};

const _autonomousBudgetDeps: AutonomousBudgetDeps | null = null;
