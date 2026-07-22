/** Worker-runtime types: pool. */
import type { RepiSwarmClaimLedgerEventV1, RepiSwarmRuntimeRetryBudget, RepiSwarmRuntimeState } from "./swarm.ts";

export type RepiWorkerRuntimePoolWorkerV1 = {
	workerId: string;
	role: string;
	route: string;
	packetId: string;
	attempt: number;
	maxAttempts: number;
	retryBudget: RepiSwarmRuntimeRetryBudget;
	resourceLease: {
		cpuSlots: number;
		memoryMb: number;
		maxProcesses: number;
	};
	timeoutMs: number;
	status: RepiSwarmRuntimeState | "passed" | "failed" | "timeout" | "retry_queued" | "exhausted";
	startedAt?: string;
	endedAt?: string;
	cancelledAt?: string;
	sessionDir: string;
	stdoutPath: string;
	stderrPath: string;
	stdoutSha256: string;
	stderrSha256: string;
	toolCallDigest: string;
	mergeKey: string | string[];
	claimRefs: string[];
};

export type RepiWorkerRuntimePoolV1 = {
	kind: "WorkerRuntimePoolV1";
	schemaVersion: 1;
	poolId: string;
	maxConcurrency: number;
	timeoutMs: number;
	cancelOnTimeout: boolean;
	resourceBudget: {
		cpuSlots: number;
		memoryMb: number;
		maxProcesses: number;
	};
	workers: RepiWorkerRuntimePoolWorkerV1[];
	parallelGroups: {
		groupId: string;
		workers: string[];
		dependsOn: string[];
		maxConcurrency: number;
	}[];
	mergeProtocol: {
		strategy: "claim-aware merge";
		evidenceContract: string[];
		conflicts: {
			mergeKey: string;
			workers: string[];
			status: "resolved" | "unresolved";
			winner?: string;
			evidenceRefs: string[];
			resolutionReason?: string;
		}[];
	};
	claimLedgerEvents: RepiSwarmClaimLedgerEventV1[];
};
