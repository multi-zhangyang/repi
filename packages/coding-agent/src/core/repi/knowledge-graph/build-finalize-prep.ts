/** Knowledge-graph finalize: mutable input prep + default similarity index. */
import type { KnowledgeNode } from "./types.ts";

export function prepareKnowledgeGraphFinalizeState(input: {
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	dispatcherRoutingHints: string[];
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	caseSignatures: string[];
	seedWorkerRoutingHints?: string[];
	seedSimilarityIndex?: string[];
	nodes: KnowledgeNode[];
}): {
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	dispatcherRoutingHints: string[];
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	caseSignatures: string[];
	workerRoutingHints: string[];
	similarityIndex: string[];
} {
	return {
		adaptiveRoutingHints: [...input.adaptiveRoutingHints],
		workerPromotionQueue: [...input.workerPromotionQueue],
		dispatcherRoutingHints: [...input.dispatcherRoutingHints],
		dispatcherScoreDecay: [...input.dispatcherScoreDecay],
		repeatedFailureDemotions: [...input.repeatedFailureDemotions],
		highScorePromotions: [...input.highScorePromotions],
		caseSignatures: [...input.caseSignatures],
		workerRoutingHints: [...(input.seedWorkerRoutingHints ?? [])],
		similarityIndex:
			input.seedSimilarityIndex && input.seedSimilarityIndex.length > 0
				? [...input.seedSimilarityIndex]
				: input.nodes.slice(0, 40).map((node: any) => `${node.id}:${node.tags.slice(0, 4).join(",")}`),
	};
}
