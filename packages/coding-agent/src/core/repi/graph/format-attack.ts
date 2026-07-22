/** Attack graph formatters. */

import { truncateMiddle } from "../text.ts";
import type { AttackGraphArtifact } from "./types.ts";

export function formatAttackGraph(graph: AttackGraphArtifact, path?: string): string {
	return [
		"attack_graph:",
		path ? `graph_artifact: ${path}` : undefined,
		`timestamp: ${graph.timestamp}`,
		`mission_id: ${graph.missionId ?? "none"}`,
		`route: ${graph.route ?? "none"}`,
		`target: ${graph.target ?? "<none>"}`,
		`nodes: ${graph.nodes.length}`,
		`edges: ${graph.edges.length}`,
		`task_tree_nodes: ${graph.taskTree.length}`,
		"criticalpath:",
		...graph.criticalPath.map((item: any) => `- ${item}`),
		"gaps:",
		...(graph.gaps.length ? graph.gaps.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_next_actions:",
		...(graph.nextActions.length ? graph.nextActions.map((item: any) => `- ${item}`) : ["- none"]),
		"source_artifacts:",
		...(graph.sourceArtifacts.length ? graph.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}

export function formatAttackGraphArtifactMarkdown(
	graph: AttackGraphArtifact,
	options: { truncate?: (text: string, limit: number) => string } = {},
): string {
	const truncate = options.truncate ?? truncateMiddle;
	return [
		"# REPI Attack Graph Artifact",
		"",
		formatAttackGraph(graph),
		"",
		"## Nodes",
		"",
		...graph.nodes.map(
			(node: any) =>
				`- ${node.id} [${node.kind}] ${node.label}${node.status ? ` status=${node.status}` : ""}${node.path ? ` path=${node.path}` : ""}${node.note ? ` note=${truncate(node.note, 220)}` : ""}`,
		),
		"",
		"## Edges",
		"",
		...graph.edges.map(
			(edge: any) => `- ${edge.from} --${edge.kind}${edge.label ? `:${edge.label}` : ""}--> ${edge.to}`,
		),
		"",
		"## Task Tree",
		"",
		...graph.taskTree.map(
			(node: any) =>
				`- ${node.parentId ? `${node.parentId} -> ` : ""}${node.id} [${node.kind}] ${node.label}${node.status ? ` status=${node.status}` : ""}${node.command ? ` command=${truncate(node.command, 180)}` : ""}${node.path ? ` path=${node.path}` : ""}${node.evidence?.length ? ` evidence=${truncate(node.evidence.slice(0, 4).join(" | "), 260)}` : ""}${node.note ? ` note=${truncate(node.note, 220)}` : ""}`,
		),
		"",
		"## JSON",
		"",
		"```json",
		JSON.stringify(graph, null, 2),
		"```",
		"",
	].join("\n");
}
