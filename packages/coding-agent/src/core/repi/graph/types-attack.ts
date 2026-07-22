/** Attack graph shared types. */
export type AttackGraphNode = {
	id: string;
	kind:
		| "mission"
		| "route"
		| "lane"
		| "checkpoint"
		| "map"
		| "run"
		| "evidence"
		| "command"
		| "artifact"
		| "hypothesis"
		| "counter_evidence"
		| "verification"
		| "tool"
		| "target_profile"
		| "parser_summary"
		| "gap"
		| "next";
	label: string;
	status?: string;
	priority?: number;
	path?: string;
	note?: string;
};

export type AttackGraphEdge = {
	from: string;
	to: string;
	kind:
		| "owns"
		| "orders"
		| "blocks"
		| "evidences"
		| "requires"
		| "suggests"
		| "updates"
		| "supports"
		| "refutes"
		| "produces"
		| "verifies";
	label?: string;
};

export type AttackGraphTaskTreeNode = {
	id: string;
	parentId?: string;
	kind: AttackGraphNode["kind"];
	label: string;
	status?: string;
	command?: string;
	path?: string;
	evidence?: string[];
	note?: string;
};

export type AttackGraphArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	nodes: AttackGraphNode[];
	edges: AttackGraphEdge[];
	taskTree: AttackGraphTaskTreeNode[];
	criticalPath: string[];
	gaps: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};
