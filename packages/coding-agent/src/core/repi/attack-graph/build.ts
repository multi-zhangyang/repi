/** Attack-graph builder. */
import {
	type AttackGraphArtifact,
	type AttackGraphEdge,
	type AttackGraphNode,
	type AttackGraphTaskTreeNode,
	prioritizeAttackGraphTaskTree,
} from "../graph.ts";
import {
	recentProofLoopArtifacts,
	recentRuntimeAdapterExecutionArtifacts,
	recentSwarmArtifactsForGraph,
	runtimeAdapterLineageForGraph,
} from "../graph-artifacts.ts";
import { readCurrentMission } from "../mission.ts";
import { latestPassiveMapContext } from "../passive-map.ts";
import { ensureReconStorage } from "../resources.ts";
import { artifactBasename, readTextFile as readText } from "../storage.ts";
import { metadataValue, sha256Text, slug, truncateMiddle } from "../text.ts";
import type { AttackGraphBuildCtx } from "./build/ctx.ts";
import { appendAttackGraphEvidenceLedger } from "./build/evidence-ledger.ts";
import { appendAttackGraphEvidenceRuns } from "./build/evidence-runs.ts";
import { appendAttackGraphFinalize } from "./build/finalize.ts";
import { appendAttackGraphMissionMap } from "./build/mission-map.ts";
import { appendAttackGraphProofLoop } from "./build/proof-loop.ts";
import { appendAttackGraphReverseCapture } from "./build/reverse-capture.ts";
import { appendAttackGraphRuntimeAdapters } from "./build/runtime-adapters.ts";
import { appendAttackGraphSwarm } from "./build/swarm.ts";
import { assembleAttackGraphArtifact } from "./build-assemble.ts";

export function buildAttackGraph(): AttackGraphArtifact {
	ensureReconStorage();
	const timestamp = new Date().toISOString();
	const mission = readCurrentMission();
	const map = latestPassiveMapContext();
	const runtimeAdapterArtifacts = recentRuntimeAdapterExecutionArtifacts();
	const proofLoopArtifacts = recentProofLoopArtifacts();
	const swarmArtifacts = recentSwarmArtifactsForGraph();
	const nodes = new Map<string, AttackGraphNode>();
	const edges: AttackGraphEdge[] = [];
	const taskTree: AttackGraphTaskTreeNode[] = [];
	const addNode = (node: AttackGraphNode) => {
		if (!nodes.has(node.id)) nodes.set(node.id, node);
	};
	const addEdge = (edge: AttackGraphEdge) => {
		if (!edges.some((item: any) => item.from === edge.from && item.to === edge.to && item.kind === edge.kind))
			edges.push(edge);
	};
	const addTask = (node: AttackGraphTaskTreeNode) => {
		if (!taskTree.some((item: any) => item.id === node.id)) taskTree.push(node);
	};
	const sourceArtifacts: string[] = [];
	const gaps: string[] = [];
	const criticalPath: string[] = [];
	const nextActions: string[] = [];
	const ctx: AttackGraphBuildCtx = {
		timestamp,
		mission,
		map,
		runtimeAdapterArtifacts,
		proofLoopArtifacts,
		swarmArtifacts,
		nodes,
		edges,
		taskTree,
		sourceArtifacts,
		gaps,
		criticalPath,
		runtimeArtifactLineage: [],
		nextActions,
		addNode,
		addEdge,
		addTask,
		slug,
		artifactBasename,
		truncateMiddle,
		sha256Text,
		readText,
		metadataValue,
	};
	appendAttackGraphReverseCapture(ctx);
	ctx.runtimeArtifactLineage = runtimeAdapterLineageForGraph(runtimeAdapterArtifacts, slug, artifactBasename);
	appendAttackGraphMissionMap(ctx);
	appendAttackGraphEvidenceRuns(ctx);
	appendAttackGraphRuntimeAdapters(ctx);
	appendAttackGraphProofLoop(ctx);
	appendAttackGraphSwarm(ctx);
	appendAttackGraphEvidenceLedger(ctx);
	appendAttackGraphFinalize(ctx);
	return assembleAttackGraphArtifact({
		timestamp,
		mission,
		map,
		runtimeAdapterArtifacts,
		swarmArtifacts,
		nodes,
		edges,
		taskTree,
		criticalPath,
		gaps,
		nextActions,
		sourceArtifacts,
		prioritize: prioritizeAttackGraphTaskTree,
	});
}
