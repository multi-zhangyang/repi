import type { KnowledgeScopeIsolationV1 } from "../knowledge-scope.ts";
import type { MemoryScopeIsolationVerdict } from "../memory-stubs.ts";
import type { AutonomousExecutionBudget } from "../operator-format-types.ts";

/** Knowledge-graph types. */
export type KnowledgeNode = {
	id: string;
	kind: string;
	label: string;
	path?: string;
	route?: string;
	scopeVerdict?: MemoryScopeIsolationVerdict;
	scopeReasons?: string[];
	scopeEventId?: string;
	score: number;
	tags: string[];
};

export type KnowledgeEdge = {
	from: string;
	to: string;
	kind: "contains" | "derived_from" | "suggests" | "repairs" | "verifies" | "replays" | "resembles";
	label?: string;
};

export type KnowledgeGraphArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "build" | "query";
	query?: string;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	caseSignatures: string[];
	similarityIndex: string[];
	workerRoutingHints: string[];
	workerScoreboard: string[];
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	commandStrategyHints: string[];
	dispatcherFeedbackScoreboard: string[];
	dispatcherRoutingHints: string[];
	failureSignaturePriority: string[];
	failureSignatureRepairQueue: string[];
	compactResumeTelemetry: string[];
	compactResumeCaseMemory: string[];
	compactResumeRoutingHints: string[];
	knowledgeScopeIsolation: KnowledgeScopeIsolationV1;
	autonomousBudget: AutonomousExecutionBudget;
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};

export type KnowledgeGraphDeps = {
	appendEvidence: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => string | undefined;
	autonomousExecutionBudget: (...args: any[]) => any;
	failureSignaturePriorityReport: (...args: any[]) => any;
	latestDispatcherFeedbackBoard: (...args: any[]) => any;
	latestWorkerScoreboard: (...args: any[]) => any;
	readMemoryEvents: (...args: any[]) => any[];
	buildMemoryScopeIsolationReport: (...args: any[]) => any;
	knowledgeCaseMemoryCandidates: (...args: any[]) => any;
	sanitizeTargetForCommand: (...args: any[]) => string | undefined;
};
