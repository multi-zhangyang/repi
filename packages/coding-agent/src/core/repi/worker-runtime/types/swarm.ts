/** Worker-runtime types: swarm. */
import type { RepiFailureRepairArtifactHash } from "./repair.ts";

export type RepiSwarmRuntimeState = "queued" | "done" | "blocked" | "cancelled";

export type RepiSwarmRuntimeRetryBudget = {
	signature: string;
	attempt: number;
	maxAttempts: number;
	remaining: number;
	exhausted: boolean;
};

export type RepiSwarmClaimLedgerEventV1 = {
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
	artifactHashes?: RepiFailureRepairArtifactHash[];
	metadata?: Record<string, unknown>;
};
