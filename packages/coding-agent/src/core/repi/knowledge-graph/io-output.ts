/** Knowledge-graph output builder. */

import { formatKnowledgeGraph } from "../knowledge-format.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { buildKnowledgeGraph } from "./build.ts";
import { sanitizeTargetForCommand } from "./deps.ts";
import { latestKnowledgeGraphArtifactPath } from "./io-path.ts";
import { writeKnowledgeGraphArtifact } from "./io-write.ts";

export function buildKnowledgeGraphOutput(
	action: "build" | "show" | "query" = "build",
	options: { target?: string; query?: string } = {},
): string {
	if (action === "show") {
		const showTarget = sanitizeTargetForCommand(options.target) ?? sanitizeTargetForCommand(options.query);
		const path = latestKnowledgeGraphArtifactPath(
			showTarget ? { target: showTarget, requestedBy: "knowledge_graph_show" } : {},
		);
		if (!path) return "knowledge_graph:\nstatus: missing\nnext: re_knowledge_graph build";
		return truncateMiddle(readText(path), 22000);
	}
	const graph = buildKnowledgeGraph({
		target: options.target,
		query: action === "query" ? options.query : undefined,
		mode: action === "query" ? "query" : "build",
	});
	const path = writeKnowledgeGraphArtifact(graph);
	return formatKnowledgeGraph(graph, path);
}
