/** Knowledge-graph quarantined source nodes. */

import { knowledgeScopePathKey } from "../artifact-scope.ts";
import { slug } from "../text.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function appendQuarantinedKnowledgeSources(params: {
	quarantinedSources: Array<{ kind: string; path: string; text: string }>;
	scopeBySourcePath: Map<string, any>;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
}): void {
	const { quarantinedSources, scopeBySourcePath, nodes, edges, missionNodeId, route } = params;
	for (const [index, source] of quarantinedSources.entries()) {
		const scopeRow = scopeBySourcePath.get(knowledgeScopePathKey(source.path));
		const id = `scope-quarantine:${index + 1}:${source.kind}:${slug(source.path).slice(0, 28)}`;
		nodes.push({
			id,
			kind: "scope_quarantine",
			label: `scope blocked ${source.kind}: ${source.path}`,
			path: source.path,
			route,
			scopeVerdict: scopeRow?.verdict ?? "block",
			scopeReasons: scopeRow?.reasons ?? [],
			scopeEventId: scopeRow?.eventId,
			score: 5,
			tags: ["memory-scope-isolation", "knowledge-scope-quarantine", "quarantine"],
		});
		edges.push({
			from: missionNodeId,
			to: id,
			kind: "repairs",
			label: `knowledge_graph_scope_filter:${scopeRow?.reasons.join(",") || "blocked"}`,
		});
	}
}
