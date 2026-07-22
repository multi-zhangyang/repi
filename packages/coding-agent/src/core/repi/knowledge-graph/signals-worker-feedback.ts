/** Dispatcher feedback node append. */

import { slug, truncateMiddle } from "../text.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function appendDispatcherFeedbackNodes(params: {
	lines: string[];
	boardPath?: string;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
}): void {
	const { lines, boardPath, nodes, edges, missionNodeId, route } = params;
	for (const [index, line] of lines.slice(0, 16).entries()) {
		const category = /\bcategory=([A-Za-z0-9_-]+)/.exec(line)?.[1] ?? "unknown";
		const score = Number(/\bscore=(\d+)/.exec(line)?.[1] ?? 45);
		const id = `dispatcher-feedback:${index + 1}:${slug(category).slice(0, 20)}`;
		nodes.push({
			id,
			kind: "dispatcher_feedback",
			label: truncateMiddle(line, 160),
			path: boardPath,
			route,
			score,
			tags: ["dispatcher-feedback", category, /\bstatus=passed\b/.test(line) ? "passed" : "repair"],
		});
		edges.push({
			from: missionNodeId,
			to: id,
			kind: score >= 80 ? "suggests" : "repairs",
			label: "dispatcher-feedback-scoreboard",
		});
	}
}
