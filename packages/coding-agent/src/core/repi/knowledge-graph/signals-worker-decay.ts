/** Dispatcher decay/demotion node append. */

import { truncateMiddle } from "../text.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function appendDispatcherDecayDemotionNodes(params: {
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	boardPath?: string;
	promotionPlaybookPath?: string;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
}): void {
	const {
		dispatcherScoreDecay,
		repeatedFailureDemotions,
		boardPath,
		promotionPlaybookPath,
		nodes,
		edges,
		missionNodeId,
		route,
	} = params;
	for (const [index, line] of dispatcherScoreDecay.slice(0, 12).entries()) {
		const effective = Number(/\beffective=(\d+)/.exec(line)?.[1] ?? 45);
		const id = `dispatcher-score-decay:${index + 1}`;
		nodes.push({
			id,
			kind: "dispatcher_score_decay",
			label: truncateMiddle(line, 160),
			path: boardPath,
			route,
			score: effective,
			tags: ["score-decay", /demote_dispatcher/.test(line) ? "repair" : "adaptive"],
		});
		edges.push({
			from: missionNodeId,
			to: id,
			kind: effective < 50 ? "repairs" : "suggests",
			label: "dispatcher-score-decay",
		});
	}
	for (const [index, line] of repeatedFailureDemotions.slice(0, 12).entries()) {
		const id = `dispatcher-demotion:${index + 1}`;
		nodes.push({
			id,
			kind: "dispatcher_demotion",
			label: truncateMiddle(line, 160),
			path: promotionPlaybookPath ?? boardPath,
			route,
			score: 35,
			tags: ["demotion", "dispatcher-feedback", "repair"],
		});
		edges.push({ from: missionNodeId, to: id, kind: "repairs", label: "repeated-failure-demotion" });
	}
}
