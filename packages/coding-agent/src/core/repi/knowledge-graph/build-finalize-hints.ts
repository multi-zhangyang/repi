/** Knowledge-graph command strategy hints assembly. */
import { knowledgeCommandHints } from "./helpers.ts";

export function buildKnowledgeCommandStrategyHints(params: {
	usableSources: Array<{ text: string }>;
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	dispatcherRoutingHints: string[];
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	failureSignature: { rows: string[]; repairQueue: string[]; commands: string[] };
	compactResumeSignals: { commandHints: string[]; routingHints: string[]; caseMemory: string[] };
	autonomousBudget: { nextActions: string[] };
}): string[] {
	const {
		usableSources,
		adaptiveRoutingHints,
		workerPromotionQueue,
		dispatcherRoutingHints,
		dispatcherScoreDecay,
		repeatedFailureDemotions,
		highScorePromotions,
		failureSignature,
		compactResumeSignals,
		autonomousBudget,
	} = params;
	return Array.from(
		new Set([
			...usableSources.flatMap((source: any) => knowledgeCommandHints(source.text)),
			...adaptiveRoutingHints.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...workerPromotionQueue.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...dispatcherRoutingHints.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...dispatcherScoreDecay.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...repeatedFailureDemotions.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...highScorePromotions.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...failureSignature.rows.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...failureSignature.repairQueue.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...failureSignature.commands,
			...compactResumeSignals.commandHints,
			...compactResumeSignals.routingHints.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...compactResumeSignals.caseMemory.flatMap((hint: any) => knowledgeCommandHints(hint)),
			...autonomousBudget.nextActions,
			...adaptiveRoutingHints.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? []),
			...workerPromotionQueue.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? []),
			...dispatcherRoutingHints.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? []),
			...dispatcherScoreDecay.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? []),
			...repeatedFailureDemotions.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? []),
			...highScorePromotions.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? []),
			...failureSignature.rows.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? []),
			...failureSignature.repairQueue.flatMap((hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? []),
			...compactResumeSignals.routingHints.flatMap(
				(hint: any) => hint.match(/re[-_][\w-]+(?:\s+[^\s;&]+){0,4}/gi) ?? [],
			),
		]),
	).slice(0, 24);
}
