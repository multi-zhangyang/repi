/** Knowledge-graph finalize: command strategy + routing + reverse next. */

import { buildKnowledgeCommandStrategyHints } from "./build-finalize-hints.ts";
import { mergeKnowledgeGraphReverseNextActions } from "./build-finalize-reverse.ts";
import { assembleKnowledgeGraphRouting } from "./next-actions.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function finalizeKnowledgeGraphRouting(input: {
	mission: any;
	route: string | undefined;
	target?: string;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	usableSources: Array<{ kind: string; path: string; text: string }>;
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	dispatcherRoutingHints: string[];
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	workerRoutingHints: string[];
	caseSignatures: string[];
	failureSignature: any;
	compactResumeSignals: any;
	autonomousBudget: any;
}): {
	commandStrategyHints: string[];
	adaptiveRoutingHints: string[];
	workerRoutingHints: string[];
	caseSignatures: string[];
	nextActions: string[];
} {
	const commandStrategyHints = buildKnowledgeCommandStrategyHints({
		usableSources: input.usableSources,
		adaptiveRoutingHints: input.adaptiveRoutingHints,
		workerPromotionQueue: input.workerPromotionQueue,
		dispatcherRoutingHints: input.dispatcherRoutingHints,
		dispatcherScoreDecay: input.dispatcherScoreDecay,
		repeatedFailureDemotions: input.repeatedFailureDemotions,
		highScorePromotions: input.highScorePromotions,
		failureSignature: input.failureSignature,
		compactResumeSignals: input.compactResumeSignals,
		autonomousBudget: input.autonomousBudget,
	});
	const routing = assembleKnowledgeGraphRouting({
		mission: input.mission,
		route: input.route,
		target: input.target,
		nodes: input.nodes,
		edges: input.edges,
		commandStrategyHints,
		adaptiveRoutingHints: input.adaptiveRoutingHints,
		workerRoutingHints: input.workerRoutingHints,
		failureSignatureCommands: input.failureSignature.commands,
		compactResumeCommandHints: input.compactResumeSignals.commandHints,
		autonomousBudgetNextActions: input.autonomousBudget.nextActions,
	});
	const nextActions = mergeKnowledgeGraphReverseNextActions({
		nextActions: routing.nextActions,
		nodes: input.nodes,
		commandStrategyHints,
	});
	commandStrategyHints.splice(0, commandStrategyHints.length, ...routing.commandStrategyHints);
	const adaptiveRoutingHints = [...input.adaptiveRoutingHints];
	adaptiveRoutingHints.splice(0, adaptiveRoutingHints.length, ...routing.adaptiveRoutingHints);
	const workerRoutingHints = [...input.workerRoutingHints];
	workerRoutingHints.splice(0, workerRoutingHints.length, ...routing.workerRoutingHints);
	const caseSignatures = [...input.caseSignatures, ...routing.caseSignatures];
	return {
		commandStrategyHints,
		adaptiveRoutingHints,
		workerRoutingHints,
		caseSignatures,
		nextActions,
	};
}
