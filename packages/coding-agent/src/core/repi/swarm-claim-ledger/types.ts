/** Swarm claim ledger types. */
export type FailureRepairArtifactHash = {
	path: string;
	sha256: string;
	tier: string;
};

export type SwarmClaimLedgerEventV1 = {
	kind: "ClaimLedgerEventV1";
	seq: number;
	prevHash: string;
	eventHash: string;
	timestamp: string;
	source: "re_swarm";
	type: "artifact_handoff" | "claim" | "validation" | "challenge" | "resolution";
	claimId?: string;
	claimIds?: string[];
	workerId?: string;
	role?: string;
	scope?: string;
	status?: "proven" | "gap" | "pending" | "blocked" | "pass" | "fail" | "accepted" | "queued_repair";
	statement?: string;
	challenge?: string;
	resolution?: string;
	evidenceRefs: string[];
	artifactHashes?: FailureRepairArtifactHash[];
	metadata?: Record<string, unknown>;
};

/** Minimal swarm shape required to build a claim ledger (duck-typed). */
export type SwarmClaimLedgerInput = {
	timestamp: string;
	mode?: string;
	target?: string;
	missionId?: string;
	route?: string;
	delegationArtifact?: string;
	subagentRuntimeManifestPath?: string;
	sourceArtifacts: string[];
	workers: Array<{ id: string; role?: string; objective?: string; [key: string]: unknown }>;
	executions: Array<{ workerId: string; status?: string; command?: string; [key: string]: unknown }>;
	subagentRuntimeManifests?: Array<{
		workerId: string;
		runtimeManifestFile?: string;
		stdoutPath?: string;
		stderrPath?: string;
		[key: string]: unknown;
	}>;
	subagentRuntimeManifestCount?: number;
	subagentRuntimeManifestsCaptured?: boolean;
	parallelPlan?: {
		planId?: string;
		merge?: { strategy?: string; expectedArtifacts?: string[] };
		[key: string]: unknown;
	};
	[key: string]: unknown;
};
