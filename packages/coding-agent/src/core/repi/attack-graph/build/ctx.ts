/** Attack-graph build context shared by section builders. */
import type { AttackGraphEdge, AttackGraphNode, AttackGraphTaskTreeNode } from "../../graph.ts";

export type AttackGraphBuildCtx = {
	timestamp: string;
	mission: any;
	map: any;
	runtimeAdapterArtifacts: any[];
	proofLoopArtifacts: any[];
	swarmArtifacts: any[];
	nodes: Map<string, AttackGraphNode>;
	edges: AttackGraphEdge[];
	taskTree: AttackGraphTaskTreeNode[];
	sourceArtifacts: string[];
	gaps: string[];
	criticalPath: string[];
	runtimeArtifactLineage: any[];
	nextActions: string[];
	addNode: (node: AttackGraphNode) => void;
	addEdge: (edge: AttackGraphEdge) => void;
	addTask: (node: AttackGraphTaskTreeNode) => void;
	slug: (...args: any[]) => string;
	artifactBasename: (...args: any[]) => string;
	truncateMiddle: (...args: any[]) => string;
	sha256Text: (...args: any[]) => string;
	readText: (...args: any[]) => string;
	metadataValue: (...args: any[]) => string | undefined;
};
