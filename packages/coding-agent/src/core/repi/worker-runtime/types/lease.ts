/** Worker-runtime types: lease. */
export type RepiWorkerLeaseSchedulerTaskV1 = {
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

export type RepiWorkerLeaseSchedulerEventV1 = {
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

export type RepiWorkerLeaseSchedulerV1 = {
	kind: "WorkerLeaseSchedulerV1";
	schemaVersion: 1;
	generatedAt: string;
	schedulerId: string;
	maxConcurrency: number;
	workerIds: string[];
	tasks: RepiWorkerLeaseSchedulerTaskV1[];
	events: RepiWorkerLeaseSchedulerEventV1[];
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
