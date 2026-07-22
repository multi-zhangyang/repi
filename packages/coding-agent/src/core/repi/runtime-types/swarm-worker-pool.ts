import type { SwarmClaimLedgerEventV1 } from "../swarm-claim-ledger/types.ts";
import type { SwarmRuntimeRetryBudget, SwarmRuntimeState } from "../swarm-exec.ts";
/** Runtime types: worker runtime pool. */

export type WorkerRuntimePoolWorkerV1 = {
	workerId: string;
	role: string;
	route: string;
	packetId: string;
	attempt: number;
	maxAttempts: number;
	retryBudget: SwarmRuntimeRetryBudget;
	resourceLease: {
		cpuSlots: number;
		memoryMb: number;
		maxProcesses: number;
	};
	timeoutMs: number;
	status: SwarmRuntimeState | "passed" | "failed" | "timeout" | "retry_queued" | "exhausted";
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

export type WorkerRuntimePoolV1 = {
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
	workers: WorkerRuntimePoolWorkerV1[];
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
	claimLedgerEvents: SwarmClaimLedgerEventV1[];
};
