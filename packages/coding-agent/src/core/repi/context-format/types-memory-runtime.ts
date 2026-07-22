/** Context pack memory view types (active/maturation/deposition/experience/ledger). */
export type ContextPackMemoryActiveKernelView = {
	MemoryActiveKernelV14?: boolean;
	unified_memory_decision_engine?: boolean;
	active_recall_scheduler?: boolean;
	scope_safe_strategy_injection?: boolean;
	status?: string;
	decisionCount?: number;
	injectDecisionIds: string[];
	reuseDecisionIds: string[];
	reportPath?: string;
	injectionPackPath?: string;
	strategyBoardPath?: string;
	[key: string]: unknown;
};

export type ContextPackMemoryMaturationView = {
	MemoryMaturationRuntimeV15?: boolean;
	automatic_memory_maturation_pipeline?: boolean;
	tool_result_to_strategy_loop?: boolean;
	closed_loop_writeback?: boolean;
	status?: string;
	rowCount?: number;
	promotedEventIds: string[];
	pendingFeedbackEventIds: string[];
	reportPath?: string;
	ledgerPath?: string;
	actionBoardPath?: string;
	[key: string]: unknown;
};

export type ContextPackMemoryDepositionView = {
	MemoryDepositionEngineV7?: boolean;
	runtime_step_event_bus?: boolean;
	post_tool_writeback_autocapture?: boolean;
	status?: string;
	runtimeEventCount?: number;
	memoryWritebackCount?: number;
	depositionReportPath?: string;
	depositionEventBusPath?: string;
	[key: string]: unknown;
};

export type ContextPackMemoryExperienceView = {
	MemoryExperienceEngineV8?: boolean;
	episode_model_v8?: boolean;
	structured_claim_extraction?: boolean;
	lesson_promotion_check?: boolean;
	status?: string;
	episodeCount?: number;
	claimCount?: number;
	lessonCount?: number;
	reportPath?: string;
	lessonBookPath?: string;
	[key: string]: unknown;
};

export type ContextPackCompactResumeLedgerView = {
	CompactResumeLedgerV2?: boolean;
	append_only_transition_ledger?: boolean;
	idempotent_multi_compact_replay?: boolean;
	auto_resume_budget_enforced?: boolean;
	currentState?: string;
	transitions: unknown[];
	invalidTransitions: unknown[];
	reportPath?: string;
	transitionPath?: string;
	[key: string]: unknown;
};
