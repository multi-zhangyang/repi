/** Context pack memory view types (orchestrator/quality/replay/strategy). */
/** Context pack format memory-related nested views. */
export type ContextPackMemoryOrchestratorView = {
	MemoryOrchestratorV6?: boolean;
	mandatory_memory_control_loop?: boolean;
	phase?: string;
	reportPath?: string;
	retrievalHitIds: string[];
	injectionEventIds: string[];
	compactResumeStatus?: string;
	[key: string]: unknown;
};

export type ContextPackMemoryQualityView = {
	MemoryQualityLedgerV11?: boolean;
	active_memory_policy?: boolean;
	quality_score_feedback_loop?: boolean;
	status?: string;
	rowCount?: number;
	averageQualityScore?: number;
	requiredFeedbackEventIds: string[];
	reportPath?: string;
	ledgerPath?: string;
	[key: string]: unknown;
};

export type ContextPackMemoryReplayView = {
	MemoryReplayEvaluatorV12?: boolean;
	memory_ab_replay?: boolean;
	causal_attribution_signal?: boolean;
	status?: string;
	scenarioCount?: number;
	averageCausalScore?: number;
	totalSavedStepEstimate?: number;
	attributionEventIds: string[];
	regressionEventIds: string[];
	reportPath?: string;
	ledgerPath?: string;
	[key: string]: unknown;
};

export type ContextPackMemoryStrategyView = {
	MemoryStrategyCapsuleV13?: boolean;
	executable_strategy_capsule?: boolean;
	replay_backed_strategy_promotion?: boolean;
	strategy_quality_check?: boolean;
	status?: string;
	capsuleCount?: number;
	promotedCapsuleIds: string[];
	reportPath?: string;
	capsuleLedgerPath?: string;
	strategyBookPath?: string;
	[key: string]: unknown;
};
