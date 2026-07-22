/** High-score promotion signal nodes for knowledge-graph. */

import { truncateMiddle } from "../text.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function appendHighScorePromotionNodes(params: {
	highScorePromotions: string[];
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
	promotionPlaybookPath?: string;
	dispatcherBoardPath?: string;
}): void {
	const { highScorePromotions, nodes, edges, missionNodeId, route, promotionPlaybookPath, dispatcherBoardPath } =
		params;
	for (const [index, line] of highScorePromotions.slice(0, 12).entries()) {
		const score = Number(/\bscore=(\d+)/.exec(line)?.[1] ?? 88);
		const id = `dispatcher-promotion:${index + 1}`;
		nodes.push({
			id,
			kind: "dispatcher_promotion",
			label: truncateMiddle(line, 160),
			path: promotionPlaybookPath ?? dispatcherBoardPath,
			route,
			score,
			tags: ["promotion", "dispatcher-feedback", "playbook"],
		});
		edges.push({ from: missionNodeId, to: id, kind: "suggests", label: "high-score-promotion" });
	}
}
