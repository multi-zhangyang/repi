/** Operator runtime DI type (softband). */
export type OperatorRuntimeDeps = {
	[key: string]: any;
	latestReplayerArtifactPath?: (...args: any[]) => any;
	writeDispatcherPromotionPlaybook: (...args: any[]) => any;
	addStep?: (...args: any[]) => any;
	appendEvidence: (...args: any[]) => any;
	appendRuntimeFailureRepairFromOperator: (...args: any[]) => any;
	artifactTargetMatches: (...args: any[]) => any;
	autonomousLaneDemotionRows: (...args: any[]) => any;
	caseMemoryLanePlanLines: (...args: any[]) => any;
	commandTargetSuffix: (...args: any[]) => any;
	compactionResumeTelemetryPath: (...args: any[]) => any;
	cumulativeDispatcherScoreDecayRows: (...args: any[]) => any;
	dispatcherScoreDecayRows: (...args: any[]) => any;
	executeOperatorStep: (...args: any[]) => any;
	formatReconCompactionResumeTelemetry: (...args: any[]) => any;
	highScorePromotionRows: (...args: any[]) => any;
	latestAutonomousBudgetLedger: (...args: any[]) => any;
	latestOrBuildContextPack: (...args: any[]) => any;
	latestReconCompactionResumeTelemetry: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	latestSwarmRetryQueue: (...args: any[]) => any;
	repeatedFailureDemotionRows: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	updateReconCompactionTelemetryFromOperator: (...args: any[]) => any;
	workerScoreDemotionRows: (...args: any[]) => any;

	operatorFeedbackNextCommands?: (...args: any[]) => any;
	bootstrapToolFromCommand?: (...args: any[]) => any;
	commanderPolicyFromContext?: (...args: any[]) => any;
	latestOperatorFeedback?: (...args: any[]) => any;
	operatorCommandConcrete?: (...args: any[]) => any;
	operatorFeedbackDispatchPlan?: (...args: any[]) => any;
	operatorFeedbackDispatcherCommands?: (...args: any[]) => any;
	operatorStepPriority?: (...args: any[]) => any;
};
