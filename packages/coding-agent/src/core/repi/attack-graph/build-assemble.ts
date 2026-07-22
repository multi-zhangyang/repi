/** Assemble AttackGraphArtifact payload after append stages. */
import type {
	AttackGraphArtifact,
	AttackGraphEdge,
	AttackGraphNode,
	AttackGraphTaskTreeNode,
} from "../graph/types-attack.ts";

export function assembleAttackGraphArtifact(params: {
	timestamp: string;
	mission: any;
	map: any;
	runtimeAdapterArtifacts: any[];
	swarmArtifacts: any[];
	nodes: Map<string, AttackGraphNode>;
	edges: AttackGraphEdge[];
	taskTree: AttackGraphTaskTreeNode[];
	criticalPath: string[];
	gaps: string[];
	nextActions: string[];
	sourceArtifacts: string[];
	prioritize: (taskTree: AttackGraphTaskTreeNode[], limit: number) => AttackGraphTaskTreeNode[];
}): AttackGraphArtifact {
	const {
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
		prioritize,
	} = params;
	return {
		timestamp,
		missionId: mission?.id,
		route: mission?.route.domain,
		target:
			map?.target ??
			runtimeAdapterArtifacts.find((item: any) => item.artifact.target)?.artifact.target ??
			swarmArtifacts.find((item: any) => item.swarm.target)?.swarm.target,
		nodes: [...nodes.values()],
		edges,
		taskTree: prioritize(taskTree, 160),
		criticalPath: criticalPath.length ? criticalPath : ["no mission route selected"],
		gaps: Array.from(new Set(gaps)).slice(0, 24),
		nextActions,
		sourceArtifacts: Array.from(new Set(sourceArtifacts)).slice(0, 24),
	};
}
