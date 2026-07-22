/** Knowledge-graph assemble from collected sources (reverse routing hints). */

import { assembleKnowledgeWorkerRoutingHints, buildKnowledgeCaseSignatures } from "./build-case.ts";
import { finalizeKnowledgeGraphArtifact } from "./build-finalize.ts";
import { collectKnowledgeGraphSources } from "./build-sources.ts";
import { appendKnowledgeRuntimeSignalNodes } from "./signals.ts";
import type { KnowledgeGraphArtifact } from "./types.ts";

export function buildKnowledgeGraph(
	options: { target?: string; query?: string; mode?: "build" | "query" } = {},
): KnowledgeGraphArtifact {
	const { mission, missionId, missionNodeId, route, nodes, edges, usableSources, knowledgeScopeIsolation, query } =
		collectKnowledgeGraphSources(options);
	const runtimeSignals = appendKnowledgeRuntimeSignalNodes({
		nodes,
		edges,
		missionNodeId,
		route,
		target: options.target,
		missionTask: mission?.task,
	});
	const {
		scoreboard,
		adaptiveRoutingHints,
		workerPromotionQueue,
		dispatcherBoard,
		autonomousBudget,
		dispatcherScoreDecay,
		repeatedFailureDemotions,
		highScorePromotions,
		compactResumeSignals,
		failureSignature,
		dispatcherRoutingHints,
	} = runtimeSignals;
	const allTags = Array.from(new Set(nodes.flatMap((node: any) => node.tags))).filter((tag: any) => tag !== "mission");
	const caseSignatures = buildKnowledgeCaseSignatures({
		route,
		target: options.target,
		missionTask: mission?.task,
		allTags,
		usableSourcesCount: usableSources.length,
		knowledgeScopeIsolation,
		nodes,
		scoreboardEntries: scoreboard.entries.length,
		adaptiveRoutingHints: adaptiveRoutingHints.length,
		workerPromotionQueue: workerPromotionQueue.length,
		dispatcherBoardLines: dispatcherBoard.lines.length,
		dispatcherRoutingHints: dispatcherRoutingHints.length,
		autonomousBudget,
		dispatcherScoreDecay: dispatcherScoreDecay.length,
		repeatedFailureDemotions: repeatedFailureDemotions.length,
		highScorePromotions: highScorePromotions.length,
		compactResumeSignals,
		failureSignature,
	});
	const seedSimilarityIndex = nodes
		.filter((node: any) => node.path && node.kind !== "scope_quarantine")
		.sort((a: any, b: any) => b.score - a.score)
		.slice(0, 16)
		.map((node: any) => `${node.score} ${node.kind} ${node.tags.join(",")} ${node.path}`);
	const seedWorkerRoutingHints = assembleKnowledgeWorkerRoutingHints({
		allTags,
		adaptiveRoutingHints,
		route,
		target: options.target,
		missionTask: mission?.task,
	});
	return finalizeKnowledgeGraphArtifact({
		options,
		mission,
		missionId,
		route,
		nodes,
		edges,
		usableSources,
		adaptiveRoutingHints,
		workerPromotionQueue,
		dispatcherRoutingHints,
		dispatcherScoreDecay,
		repeatedFailureDemotions,
		highScorePromotions,
		allTags,
		caseSignatures,
		knowledgeScopeIsolation,
		scoreboard,
		dispatcherBoard,
		failureSignature,
		compactResumeSignals,
		autonomousBudget,
		query,
		seedWorkerRoutingHints,
		seedSimilarityIndex,
	});
}
