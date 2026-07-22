/** Knowledge-graph routing finalize + reverse next merge. */

import { assembleKnowledgeGraphArtifact } from "./build-finalize-artifact.ts";
import { prepareKnowledgeGraphFinalizeState } from "./build-finalize-prep.ts";
import { finalizeKnowledgeGraphRouting } from "./build-finalize-route.ts";
import type { KnowledgeEdge, KnowledgeGraphArtifact, KnowledgeNode } from "./types.ts";

export function finalizeKnowledgeGraphArtifact(input: {
	options: { target?: string; query?: string; mode?: "build" | "query" };
	mission: any;
	missionId: string | undefined;
	route: string | undefined;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	usableSources: Array<{ kind: string; path: string; text: string }>;
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	dispatcherRoutingHints: string[];
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	allTags: string[];
	caseSignatures: string[];
	knowledgeScopeIsolation: any;
	scoreboard: any;
	dispatcherBoard: any;
	failureSignature: any;
	compactResumeSignals: any;
	autonomousBudget: any;
	query: string | undefined;
	seedWorkerRoutingHints?: string[];
	seedSimilarityIndex?: string[];
}): KnowledgeGraphArtifact {
	const {
		options,
		mission,
		missionId,
		route,
		nodes,
		edges,
		usableSources,
		knowledgeScopeIsolation,
		scoreboard,
		dispatcherBoard,
		failureSignature,
		compactResumeSignals,
		autonomousBudget,
		query,
	} = input;
	const state = prepareKnowledgeGraphFinalizeState({
		adaptiveRoutingHints: input.adaptiveRoutingHints,
		workerPromotionQueue: input.workerPromotionQueue,
		dispatcherRoutingHints: input.dispatcherRoutingHints,
		dispatcherScoreDecay: input.dispatcherScoreDecay,
		repeatedFailureDemotions: input.repeatedFailureDemotions,
		highScorePromotions: input.highScorePromotions,
		caseSignatures: input.caseSignatures,
		seedWorkerRoutingHints: input.seedWorkerRoutingHints,
		seedSimilarityIndex: input.seedSimilarityIndex,
		nodes,
	});
	const routed = finalizeKnowledgeGraphRouting({
		mission,
		route,
		target: options.target,
		nodes,
		edges,
		usableSources,
		adaptiveRoutingHints: state.adaptiveRoutingHints,
		workerPromotionQueue: state.workerPromotionQueue,
		dispatcherRoutingHints: state.dispatcherRoutingHints,
		dispatcherScoreDecay: state.dispatcherScoreDecay,
		repeatedFailureDemotions: state.repeatedFailureDemotions,
		highScorePromotions: state.highScorePromotions,
		workerRoutingHints: state.workerRoutingHints,
		caseSignatures: state.caseSignatures,
		failureSignature,
		compactResumeSignals,
		autonomousBudget,
	});
	return assembleKnowledgeGraphArtifact({
		options,
		missionId,
		route,
		nodes,
		edges,
		usableSources,
		caseSignatures: routed.caseSignatures,
		similarityIndex: state.similarityIndex,
		workerRoutingHints: routed.workerRoutingHints,
		scoreboard,
		adaptiveRoutingHints: routed.adaptiveRoutingHints,
		workerPromotionQueue: state.workerPromotionQueue,
		commandStrategyHints: routed.commandStrategyHints,
		dispatcherBoard,
		dispatcherRoutingHints: state.dispatcherRoutingHints,
		failureSignature,
		compactResumeSignals,
		knowledgeScopeIsolation,
		autonomousBudget,
		dispatcherScoreDecay: state.dispatcherScoreDecay,
		repeatedFailureDemotions: state.repeatedFailureDemotions,
		highScorePromotions: state.highScorePromotions,
		nextActions: routed.nextActions,
		query,
	});
}
