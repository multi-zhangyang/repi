/** Knowledge-graph formatter view types. */
import type { AutonomousExecutionBudget } from "./operator-format.ts";

export type KnowledgeScopeIsolationFormatView = {
	MemoryScopeIsolationV1?: boolean;
	scope_filter_by_mission_session_workspace_target?: boolean;
	checkedSourceCount?: number;
	blockedSourceCount?: number;
	warnSourceCount?: number;
	reportPath?: string;
	quarantinedSourceArtifacts: string[];
	[key: string]: unknown;
};

export type KnowledgeNodeFormatView = {
	id: string;
	score: number;
	tags: string[];
	path?: string;
	[key: string]: unknown;
};

export type KnowledgeEdgeFormatView = {
	from: string;
	to: string;
	kind: string;
	label?: string;
	[key: string]: unknown;
};

export type KnowledgeGraphFormatView = {
	timestamp: string;
	mode: string;
	missionId?: string;
	route?: string;
	target?: string;
	query?: string;
	nodes: KnowledgeNodeFormatView[];
	edges: KnowledgeEdgeFormatView[];
	caseSignatures: string[];
	knowledgeScopeIsolation: KnowledgeScopeIsolationFormatView;
	similarityIndex: string[];
	workerRoutingHints: string[];
	workerScoreboard?: string[];
	adaptiveRoutingHints?: string[];
	workerPromotionQueue?: string[];
	commandStrategyHints: string[];
	dispatcherFeedbackScoreboard?: string[];
	dispatcherRoutingHints?: string[];
	failureSignaturePriority?: string[];
	failureSignatureRepairQueue?: string[];
	compactResumeTelemetry?: string[];
	compactResumeCaseMemory?: string[];
	compactResumeRoutingHints?: string[];
	autonomousBudget?: AutonomousExecutionBudget;
	dispatcherScoreDecay?: string[];
	repeatedFailureDemotions?: string[];
	highScorePromotions?: string[];
	nextActions: string[];
	sourceArtifacts: string[];
	[key: string]: unknown;
};
