/** Worker-runtime types: handoff. */
import type { RepiWorkerRuntimePoolWorkerV1 } from "./pool.ts";
export type RepiWorkerRetryHandoffClosureWorkerV1 = {
	workerId: string;
	role: string;
	packetId: string;
	status: RepiWorkerRuntimePoolWorkerV1["status"];
	attempt: number;
	maxAttempts: number;
	retryRemaining: number;
	retryState:
		| "passed"
		| "not_needed"
		| "retry_queued"
		| "handoff_recovered"
		| "exhausted_escalated"
		| "blocked_without_closure";
	timeoutMs: number;
	timedOut: boolean;
	cancelledAt?: string;
	retryQueueRefs: string[];
	handoffRefs: string[];
	repairRefs: string[];
	claimRefs: string[];
	sourceArtifacts: string[];
	mergeKeys: string[];
	assertions: {
		attemptBounded: boolean;
		retryBudgetConsistent: boolean;
		timeoutCancellationRecorded: boolean;
		failureHasRetryOrHandoff: boolean;
		exhaustionEscalated: boolean;
		handoffBoundToClaim: boolean;
		sourceArtifactsPreserved: boolean;
	};
};
export type RepiWorkerRetryHandoffClosureV1 = {
	kind: "WorkerRetryHandoffClosureV1";
	schemaVersion: 1;
	closureId: string;
	poolId: string;
	generatedAt: string;
	strategy: "retry-budgeted claim-bound handoff closure";
	workers: RepiWorkerRetryHandoffClosureWorkerV1[];
	merge: {
		strategy: "claim-bound handoff merge";
		recoveredWorkers: string[];
		unresolvedWorkers: string[];
		collisions: {
			mergeKey: string;
			workers: string[];
			status: "resolved" | "unresolved";
			winner?: string;
			evidenceRefs: string[];
			resolutionReason?: string;
		}[];
	};
	assertions: {
		retryAttemptsBounded: boolean;
		retryBudgetsConsistent: boolean;
		timeoutCancellationRecorded: boolean;
		failedWorkersHaveRetryOrHandoff: boolean;
		exhaustedWorkersEscalated: boolean;
		handoffRefsBoundToClaims: boolean;
		mergeCollisionsResolved: boolean;
		claimRefsPreserved: boolean;
		sourceArtifactsPreserved: boolean;
	};
	errors: string[];
};

export type {
	RepiWorkerRetryHandoffClosureRowV1,
	RepiWorkerRetryHandoffMergeSummaryV1,
} from "./handoff-merge.ts";
