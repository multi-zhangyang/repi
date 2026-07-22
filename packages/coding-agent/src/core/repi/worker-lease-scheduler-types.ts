/** Worker lease scheduler types. */
export type WorkerLeaseSchedulerTaskV1 = {
	taskId: string;
	shardKey: string;
	status: "queued" | "leased" | "running" | "completed" | "requeued" | "stale_recovered" | "failed";
	leaseId?: string;
	ownerWorkerId?: string;
	leaseExpiresAt?: string;
	attempt: number;
	maxAttempts: number;
	claimRefs: string[];
	artifactRefs: string[];
};

export type WorkerLeaseSchedulerEventV1 = {
	kind: "WorkerLeaseSchedulerEventV1";
	schemaVersion: 1;
	eventId: string;
	ts: string;
	type:
		| "enqueue"
		| "lease_acquired"
		| "heartbeat"
		| "stale_detected"
		| "lease_released"
		| "work_stolen"
		| "completed"
		| "dedup_rejected"
		| "failed";
	taskId: string;
	workerId?: string;
	leaseId?: string;
	prevHash: string;
	eventHash: string;
};

export type WorkerLeaseSchedulerV1 = {
	kind: "WorkerLeaseSchedulerV1";
	schemaVersion: 1;
	generatedAt: string;
	schedulerId: string;
	maxConcurrency: number;
	workerIds: string[];
	tasks: WorkerLeaseSchedulerTaskV1[];
	events: WorkerLeaseSchedulerEventV1[];
	assertions: {
		leaseExclusive: boolean;
		heartbeatRequired: boolean;
		staleLeaseRecovered: boolean;
		workStealingObserved: boolean;
		duplicateCompletionRejected: boolean;
		maxConcurrencyRespected: boolean;
		claimRefsPreserved: boolean;
		appendOnlyHashChain: boolean;
	};
};

/** Minimal swarm shape for lease scheduler construction. */
export type WorkerLeaseSwarmView = {
	timestamp?: string;
	workers: Array<{ id: string; worker?: string; sourceArtifacts?: string[]; [key: string]: unknown }>;
	parallelGroups?: unknown[];
	parallelPlan?: { planId?: string; workers?: unknown[]; [key: string]: unknown };
	subagentRuntimeManifests?: Array<{
		workerId: string;
		attempt?: number;
		status?: string;
		endedAt?: string;
		runtimeManifestFile?: string;
		stdoutPath?: string;
		stderrPath?: string;
		retryBudget?: { maxAttempts?: number };
		[key: string]: unknown;
	}>;
	claimLedger?: Array<{ workerId?: string; claimId?: string; [key: string]: unknown }>;
	claimLedgerPath?: string;
	subagentRuntimeManifestPath?: string;
	workerChildSessionRuntimePath?: string;
	[key: string]: unknown;
};
