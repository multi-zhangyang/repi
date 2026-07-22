/** Assemble KnowledgeGraphArtifact payload. */
import type { KnowledgeEdge, KnowledgeGraphArtifact, KnowledgeNode } from "./types.ts";

export function assembleKnowledgeGraphArtifact(input: {
	options: { target?: string; query?: string; mode?: "build" | "query" };
	missionId: string | undefined;
	route: string | undefined;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	usableSources: Array<{ kind: string; path: string; text: string }>;
	caseSignatures: string[];
	similarityIndex: string[];
	workerRoutingHints: string[];
	scoreboard: any;
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	commandStrategyHints: string[];
	dispatcherBoard: any;
	dispatcherRoutingHints: string[];
	failureSignature: any;
	compactResumeSignals: any;
	knowledgeScopeIsolation: any;
	autonomousBudget: any;
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	nextActions: string[];
	query: string | undefined;
}): KnowledgeGraphArtifact {
	const {
		options,
		missionId,
		route,
		nodes,
		edges,
		usableSources,
		caseSignatures,
		similarityIndex,
		workerRoutingHints,
		scoreboard,
		adaptiveRoutingHints,
		workerPromotionQueue,
		commandStrategyHints,
		dispatcherBoard,
		dispatcherRoutingHints,
		failureSignature,
		compactResumeSignals,
		knowledgeScopeIsolation,
		autonomousBudget,
		dispatcherScoreDecay,
		repeatedFailureDemotions,
		highScorePromotions,
		nextActions,
		query,
	} = input;
	return {
		timestamp: new Date().toISOString(),
		missionId,
		route,
		target: options.target,
		mode: options.mode ?? (query ? "query" : "build"),
		query: options.query,
		nodes,
		edges: edges.slice(0, 240),
		caseSignatures,
		similarityIndex,
		workerRoutingHints,
		workerScoreboard: scoreboard.lines.slice(0, 32),
		adaptiveRoutingHints,
		workerPromotionQueue,
		commandStrategyHints,
		dispatcherFeedbackScoreboard: dispatcherBoard.lines.slice(0, 32),
		dispatcherRoutingHints,
		failureSignaturePriority: failureSignature.rows,
		failureSignatureRepairQueue: failureSignature.repairQueue,
		compactResumeTelemetry: compactResumeSignals.lines,
		compactResumeCaseMemory: compactResumeSignals.caseMemory,
		compactResumeRoutingHints: compactResumeSignals.routingHints,
		knowledgeScopeIsolation,
		autonomousBudget,
		dispatcherScoreDecay,
		repeatedFailureDemotions,
		highScorePromotions,
		nextActions,
		sourceArtifacts: Array.from(
			new Set(
				[
					...usableSources.map((source: any) => source.path),
					knowledgeScopeIsolation.reportPath,
					...knowledgeScopeIsolation.quarantinedSourceArtifacts,
					dispatcherBoard.path,
					autonomousBudget.promotionPlaybookPath,
					...failureSignature.sourceArtifacts,
					...compactResumeSignals.sourceArtifacts,
				].filter(Boolean) as string[],
			),
		).slice(0, 80),
	};
}
