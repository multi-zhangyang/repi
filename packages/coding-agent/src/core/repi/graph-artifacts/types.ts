/** Graph artifact type aliases. */
import type {
	RuntimeAdapterExecutionArtifactV1,
	RuntimeAdapterParserRuleV1,
	RuntimeAdapterParserSignalSummaryV1,
} from "../runtime-adapter.ts";

export type RuntimeAdapterExecutionGraphArtifact = RuntimeAdapterExecutionArtifactV1 & {
	stdoutHead?: string;
	stderrHead?: string;
};

export type RuntimeAdapterGraphParserSummary = RuntimeAdapterParserSignalSummaryV1;

export type RuntimeAdapterGraphEvidenceRank = RuntimeAdapterParserRuleV1["evidenceRank"];

export type RuntimeAdapterMitigationGraphEvidence = {
	kind: "binary-mitigation-map";
	expected: boolean;
	matched: boolean;
	status: "matched" | "declared" | "missing-proof";
	proofExitSignal: "binary mitigation map";
	evidence: string[];
	missing: string[];
};

export type RepiProofLoopGraphStep = {
	id: string;
	phase: string;
	command: string;
	status: "ready" | "done" | "blocked" | "skipped" | string;
	reason?: string;
	sourceArtifacts: string[];
};

export type RepiProofLoopGraphExecution = {
	stepId: string;
	command: string;
	status: "ready" | "done" | "blocked" | "skipped" | string;
	output: string;
};

export type RepiProofLoopGraphArtifact = {
	timestamp?: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "run";
	maxSteps?: number;
	replaySteps?: number;
	steps: RepiProofLoopGraphStep[];
	executed: RepiProofLoopGraphExecution[];
	verdict?: "ready" | "partial" | "needs_repair" | "blocked" | string;
	gapClassifier: string[];
	quickPath: string[];
	quickPlanPhases: string[];
	quickPlanAssertions: string[];
	runtimeAdapterClosure: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};

export type SwarmGraphArtifact = {
	timestamp?: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode?: string;
	workers?: unknown[];
	executions?: unknown[];
	mergeDigest?: string[];
	nextActions?: string[];
	sourceArtifacts?: string[];
	[key: string]: unknown;
};

export type RuntimeAdapterLineageRow = {
	path: string;
	artifact: RuntimeAdapterExecutionGraphArtifact;
	artifactBase: string;
	adapterId: string;
	target: string;
	artifactId: string;
	commandId: string;
};

/** Pure: map recent runtime-adapter artifacts into attack-graph lineage rows. */

export type AttackGraphMissionSlice = {
	nodes: Array<{ id: string; kind: string; label: string; status?: string; note?: string }>;
	edges: Array<{ from: string; to: string; kind: string; label?: string }>;
	taskTree: Array<{
		id: string;
		parentId?: string;
		kind: string;
		label: string;
		status?: string;
		evidence?: string[];
		note?: string;
	}>;
	gaps: string[];
	criticalPath: string[];
};

/** Pure: seed attack-graph nodes/edges/tasks from mission route/lanes/checkpoints. */
