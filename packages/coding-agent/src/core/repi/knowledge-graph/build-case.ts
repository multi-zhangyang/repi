/** Knowledge-graph case signatures and reverse routing assembly. */

import { knowledgeGraphReverseRoutingHints } from "./build-reverse.ts";
import { knowledgeWorkerHints } from "./helpers.ts";
import type { KnowledgeNode } from "./types.ts";

export function buildKnowledgeCaseSignatures(input: {
	route?: string;
	target?: string;
	missionTask?: string;
	allTags: string[];
	usableSourcesCount: number;
	knowledgeScopeIsolation: {
		checkedSourceCount: number;
		blockedSourceCount: number;
		warnSourceCount: number;
	};
	nodes: KnowledgeNode[];
	scoreboardEntries: number;
	adaptiveRoutingHints: number;
	workerPromotionQueue: number;
	dispatcherBoardLines: number;
	dispatcherRoutingHints: number;
	autonomousBudget: { maxTurns: number; maxDispatch: number; maxProofLoops: number };
	dispatcherScoreDecay: number;
	repeatedFailureDemotions: number;
	highScorePromotions: number;
	compactResumeSignals: { status: string; caseMemory: unknown[]; routingHints: unknown[] };
	failureSignature: { rows: unknown[]; repairQueue: unknown[]; exhaustedCount: number; repeatedCount: number };
}): string[] {
	const {
		knowledgeScopeIsolation: scope,
		autonomousBudget: budget,
		compactResumeSignals: crs,
		failureSignature: fs,
	} = input;
	return [
		`route=${input.route ?? "unknown"}`,
		`target=${input.target ?? input.missionTask ?? "<none>"}`,
		`tags=${input.allTags.slice(0, 16).join(",") || "none"}`,
		`artifacts=${input.usableSourcesCount}`,
		`scope_checked=${scope.checkedSourceCount}`,
		`scope_blocked=${scope.blockedSourceCount}`,
		`scope_warn=${scope.warnSourceCount}`,
		`knowledge_graph_scope_filter_blocks_quarantined_artifacts=${scope.blockedSourceCount}`,
		`high_score=${input.nodes.filter((node: any) => node.score >= 70).length}`,
		`worker_scoreboard=${input.scoreboardEntries}`,
		`adaptive_routes=${input.adaptiveRoutingHints}`,
		`worker_promotions=${input.workerPromotionQueue}`,
		`dispatcher_feedback=${input.dispatcherBoardLines}`,
		`dispatcher_routes=${input.dispatcherRoutingHints}`,
		`autonomous_budget=${budget.maxTurns}/${budget.maxDispatch}/${budget.maxProofLoops}`,
		`score_decay=${input.dispatcherScoreDecay}`,
		`demotions=${input.repeatedFailureDemotions}`,
		`promotions=${input.highScorePromotions}`,
		`compact_resume_status=${crs.status}`,
		`compact_resume_case_memory=${crs.caseMemory.length}`,
		`compact_resume_routes=${crs.routingHints.length}`,
		`failure_signature_priority=${fs.rows.length}`,
		`knowledge_graph_failure_signature_priority=${fs.rows.length}`,
		`failure_signature_repairs=${fs.repairQueue.length}`,
		`failure_signature_exhausted=${fs.exhaustedCount}`,
		`failure_signature_repeated=${fs.repeatedCount}`,
	];
}

export function assembleKnowledgeWorkerRoutingHints(input: {
	allTags: string[];
	adaptiveRoutingHints: string[];
	route?: string;
	target?: string;
	missionTask?: string;
}): string[] {
	const workerRoutingHints = Array.from(
		new Set([...knowledgeWorkerHints(input.allTags), ...input.adaptiveRoutingHints]),
	).slice(0, 24);
	workerRoutingHints.push(
		...knowledgeGraphReverseRoutingHints({
			route: input.route,
			target: input.target,
			missionTask: input.missionTask,
			allTags: input.allTags,
		}),
	);
	return workerRoutingHints;
}
