/** Knowledge-graph runtime signal node assembly. */

import type {
	autonomousExecutionBudget,
	failureSignaturePriorityReport,
	latestDispatcherFeedbackBoard,
	latestWorkerScoreboard,
} from "./deps.ts";
import type { compactResumeKnowledgeSignals } from "./helpers.ts";
import { appendCompactFailureSignalNodes } from "./signals-failure.ts";
import { knowledgeRuntimeReverseNextHints } from "./signals-reverse.ts";
import { appendWorkerDispatcherSignalNodes } from "./signals-worker.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export type KnowledgeRuntimeSignals = {
	scoreboard: ReturnType<typeof latestWorkerScoreboard>;
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	dispatcherBoard: ReturnType<typeof latestDispatcherFeedbackBoard>;
	autonomousBudget: ReturnType<typeof autonomousExecutionBudget>;
	dispatcherScoreDecay: any[];
	repeatedFailureDemotions: any[];
	highScorePromotions: any[];
	compactResumeSignals: ReturnType<typeof compactResumeKnowledgeSignals>;
	failureSignature: ReturnType<typeof failureSignaturePriorityReport>;
	dispatcherRoutingHints: string[];
};

export function appendKnowledgeRuntimeSignalNodes(input: {
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
	target?: string;
	missionTask?: string;
}): KnowledgeRuntimeSignals {
	const worker = appendWorkerDispatcherSignalNodes(input);
	const compactFailure = appendCompactFailureSignalNodes(input);
	let adaptiveRoutingHints = worker.adaptiveRoutingHints;
	// reverse: reverse-heavy worker/failure corpus seeds domain capture next
	adaptiveRoutingHints = knowledgeRuntimeReverseNextHints({
		blob: JSON.stringify({
			scoreboard: worker.scoreboard,
			adaptive: adaptiveRoutingHints,
			failure: compactFailure.failureSignature,
		}),
		hints: adaptiveRoutingHints,
	});
	const dispatcherRoutingHints = worker.dispatcherBoard.hints.slice(0, 24);
	return {
		scoreboard: worker.scoreboard,
		adaptiveRoutingHints,
		workerPromotionQueue: worker.workerPromotionQueue,
		dispatcherBoard: worker.dispatcherBoard,
		autonomousBudget: worker.autonomousBudget,
		dispatcherScoreDecay: worker.dispatcherScoreDecay,
		repeatedFailureDemotions: worker.repeatedFailureDemotions,
		highScorePromotions: worker.highScorePromotions,
		compactResumeSignals: compactFailure.compactResumeSignals,
		failureSignature: compactFailure.failureSignature,
		dispatcherRoutingHints,
	};
}
