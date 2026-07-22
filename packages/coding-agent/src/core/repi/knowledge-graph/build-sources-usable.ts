/** Knowledge-graph usable source node/edge append. */

import { knowledgeScopePathKey } from "../artifact-scope.ts";
import { slug } from "../text.ts";
import { knowledgeScore, knowledgeTags } from "./helpers.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function appendUsableKnowledgeSources(params: {
	usableSources: Array<{ kind: string; path: string; text: string }>;
	scopeBySourcePath: Map<string, any>;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	missionNodeId: string;
	route?: string;
	tagToNode: Map<string, string>;
}): void {
	const { usableSources, scopeBySourcePath, nodes, edges, missionNodeId, route, tagToNode } = params;
	for (const [index, source] of usableSources.entries()) {
		const scopeRow = scopeBySourcePath.get(knowledgeScopePathKey(source.path));
		const tags = knowledgeTags(source.text, source.kind);
		const id = `artifact:${index + 1}:${source.kind}:${slug(source.path).slice(0, 28)}`;
		nodes.push({
			id,
			kind: source.kind,
			label: `${source.kind}: ${source.path}`,
			path: source.path,
			route,
			scopeVerdict: scopeRow?.verdict ?? "allow",
			scopeReasons: scopeRow?.reasons ?? [],
			scopeEventId: scopeRow?.eventId,
			score: knowledgeScore(source.kind, source.text),
			tags: [...tags, "knowledge-scope-allowed"],
		});
		edges.push({ from: missionNodeId, to: id, kind: "contains", label: source.kind });
		if (index > 0) {
			const previous = usableSources[index - 1]!;
			edges.push({
				from: `artifact:${index}:${previous.kind}:${slug(previous.path).slice(0, 28)}`,
				to: id,
				kind: "derived_from",
				label: "recent-sequence",
			});
		}
		for (const tag of tags) {
			let tagNode = tagToNode.get(tag);
			if (!tagNode) {
				tagNode = `tag:${slug(tag)}`;
				tagToNode.set(tag, tagNode);
				nodes.push({ id: tagNode, kind: "tag", label: tag, route, score: 40, tags: [tag] });
			}
			edges.push({
				from: id,
				to: tagNode,
				kind:
					tag === "repair"
						? "repairs"
						: tag === "verification"
							? "verifies"
							: tag === "replay"
								? "replays"
								: "suggests",
				label: tag,
			});
		}
	}
}
