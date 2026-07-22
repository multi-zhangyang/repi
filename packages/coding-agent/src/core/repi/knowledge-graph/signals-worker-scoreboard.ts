/** Worker scoreboard node append. */

import { slug } from "../text.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function appendWorkerScoreboardNodes(params: {
	entries: any[];
	scoreboardPath?: string;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
}): void {
	const { entries, scoreboardPath, nodes, edges, missionNodeId, route } = params;
	for (const entry of entries) {
		const id = `worker-score:${entry.worker}:${slug(entry.packetId).slice(0, 24)}`;
		nodes.push({
			id,
			kind: "worker_score",
			label: `${entry.worker} ${entry.verdict} score=${entry.score}`,
			path: scoreboardPath,
			route,
			score: entry.score,
			tags: ["worker-score", entry.worker, entry.verdict],
		});
		edges.push({
			from: missionNodeId,
			to: id,
			kind: entry.score >= 80 ? "suggests" : "repairs",
			label: "worker-scoreboard",
		});
	}
}
