/** Knowledge-graph source collection into nodes/edges. */

import { knowledgeScopePathKey } from "../artifact-scope.ts";
import { readCurrentMission } from "../mission.ts";
import { ensureReconStorage } from "../resources.ts";
import { truncateMiddle } from "../text.ts";
import { appendQuarantinedKnowledgeSources } from "./build-sources-quarantine.ts";
import { appendUsableKnowledgeSources } from "./build-sources-usable.ts";
import { buildKnowledgeScopeIsolation, knowledgeArtifactSources } from "./helpers.ts";
import type { KnowledgeEdge, KnowledgeNode } from "./types.ts";

export function collectKnowledgeGraphSources(
	options: { target?: string; query?: string; mode?: "build" | "query" } = {},
): {
	mission: any;
	missionId?: string;
	missionNodeId: string;
	route?: string;
	nodes: KnowledgeNode[];
	edges: KnowledgeEdge[];
	usableSources: any[];
	knowledgeScopeIsolation: any;
	query?: string;
} {
	ensureReconStorage();
	const mission = readCurrentMission();
	const sources = knowledgeArtifactSources();
	const query = options.query?.trim().toLowerCase();
	const nodes: KnowledgeNode[] = [];
	const edges: KnowledgeEdge[] = [];
	const tagToNode = new Map<string, string>();
	const route = mission?.route.domain;
	const missionId = mission?.id;
	const missionNodeId = missionId ? `mission:${missionId}` : "mission:none";
	const candidateSources = query
		? sources.filter((source: any) => `${source.kind}\n${source.path}\n${source.text}`.toLowerCase().includes(query))
		: sources;
	const knowledgeScopeIsolation = buildKnowledgeScopeIsolation({ target: options.target, sources: candidateSources });
	const scopeBySourcePath = new Map(
		knowledgeScopeIsolation.sourceRows.map((row: any) => [knowledgeScopePathKey(row.path), row]),
	);
	const usableSources = candidateSources.filter(
		(source) => scopeBySourcePath.get(knowledgeScopePathKey(source.path))?.blocksKnowledgeReuse !== true,
	);
	const quarantinedSources = candidateSources.filter(
		(source) => scopeBySourcePath.get(knowledgeScopePathKey(source.path))?.blocksKnowledgeReuse === true,
	);
	nodes.push({
		id: missionNodeId,
		kind: "mission",
		label: mission ? `${mission.route.domain}: ${truncateMiddle(mission.task, 120)}` : "no active mission",
		route,
		score: 50,
		tags: ["mission"],
	});
	appendUsableKnowledgeSources({
		usableSources,
		scopeBySourcePath,
		nodes,
		edges,
		missionNodeId,
		route,
		tagToNode,
	});
	appendQuarantinedKnowledgeSources({
		quarantinedSources,
		scopeBySourcePath,
		nodes,
		edges,
		missionNodeId,
		route,
	});
	return {
		mission,
		missionId,
		missionNodeId,
		route,
		nodes,
		edges,
		usableSources,
		knowledgeScopeIsolation,
		query,
	};
}
