/** Worker retry handoff merge types. */
// Landmark: RepiWorkerRetryHandoffMergeSummaryV1 ClosureRow

import type { RepiWorkerRetryHandoffClosureWorkerV1 } from "./handoff.ts";
import type { RepiWorkerRuntimePoolWorkerV1 } from "./pool.ts";

export type RepiWorkerRetryHandoffClosureRowV1 = {
	workerId: string;
	status: RepiWorkerRuntimePoolWorkerV1["status"];
	retryState: RepiWorkerRetryHandoffClosureWorkerV1["retryState"];
	attempt: number;
	maxAttempts: number;
	retryRemaining: number;
	timedOut: boolean;
	cancelledAt?: string;
	closure: "passed" | "retry_queued" | "handoff_recovered" | "exhausted_escalated" | "unresolved";
	retryQueueRefs: string[];
	handoffRefs: string[];
	repairRefs: string[];
	claimRefs: string[];
	mergeKeys: string[];
	evidenceRefs: string[];
	nextAction: string;
	summary: string;
};

export type RepiWorkerRetryHandoffMergeSummaryV1 = {
	kind: "WorkerRetryHandoffMergeSummaryV1";
	schemaVersion: 1;
	closureId: string;
	poolId: string;
	status: "pass" | "blocked";
	workerClosures: RepiWorkerRetryHandoffClosureRowV1[];
	retryQueuedWorkers: string[];
	handoffRecoveredWorkers: string[];
	exhaustedEscalatedWorkers: string[];
	unresolvedWorkers: string[];
	resolvedCollisions: string[];
	unresolvedCollisions: string[];
	nextActions: string[];
	claimRefs: string[];
	sourceArtifacts: string[];
	assertions: {
		noUnresolvedWorkers: boolean;
		collisionsResolved: boolean;
		allFailuresClosed: boolean;
		handoffEvidenceBound: boolean;
		retryBudgetVisible: boolean;
		sourceArtifactsPreserved: boolean;
	};
};
