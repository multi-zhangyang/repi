/** Build swarm worker retry handoff closure. */
import { slug } from "../text.ts";
import { buildSwarmWorkerRetryHandoffRow } from "./handoff-build-worker.ts";

type SwarmArtifact = any;

export function buildSwarmWorkerRetryHandoffClosure(swarm: SwarmArtifact, pool: any): any {
	const generatedAt = new Date().toISOString();
	const closureId = `worker-retry-handoff/${slug(swarm.route ?? swarm.target ?? "swarm")}/${swarm.timestamp}`;
	const workers = pool.workers.map((worker: any) => buildSwarmWorkerRetryHandoffRow(swarm, worker, pool));
	const recoveredWorkers = workers
		.filter((worker: any) => worker.retryState === "handoff_recovered" || worker.retryState === "retry_queued")
		.map((worker: any) => worker.workerId);
	const unresolvedWorkers = workers
		.filter((worker: any) => worker.retryState === "blocked_without_closure")
		.map((worker: any) => worker.workerId);
	const collisions = pool.mergeProtocol.conflicts.map((conflict: any) => ({
		mergeKey: conflict.mergeKey,
		workers: conflict.workers,
		status: conflict.status,
		winner: conflict.winner,
		evidenceRefs: conflict.evidenceRefs,
		resolutionReason: conflict.resolutionReason,
	}));
	const reportWithoutAssertions = {
		kind: "WorkerRetryHandoffClosureV1" as const,
		schemaVersion: 1 as const,
		closureId,
		poolId: pool.poolId,
		generatedAt,
		strategy: "retry-budgeted claim-bound handoff closure" as const,
		workers,
		merge: {
			strategy: "claim-bound handoff merge" as const,
			recoveredWorkers,
			unresolvedWorkers,
			collisions,
		},
	};
	const assertions = {
		retryAttemptsBounded: workers.every((worker: any) => worker.assertions.attemptBounded),
		retryBudgetsConsistent: workers.every((worker: any) => worker.assertions.retryBudgetConsistent),
		timeoutCancellationRecorded: workers.every((worker: any) => worker.assertions.timeoutCancellationRecorded),
		failedWorkersHaveRetryOrHandoff: workers.every((worker: any) => worker.assertions.failureHasRetryOrHandoff),
		exhaustedWorkersEscalated: workers.every((worker: any) => worker.assertions.exhaustionEscalated),
		handoffRefsBoundToClaims: workers.every((worker: any) => worker.assertions.handoffBoundToClaim),
		mergeCollisionsResolved: collisions.every((collision: any) => collision.status === "resolved"),
		claimRefsPreserved: workers.every((worker: any) => worker.claimRefs.length > 0),
		sourceArtifactsPreserved: workers.every((worker: any) => worker.assertions.sourceArtifactsPreserved),
	};
	return {
		...reportWithoutAssertions,
		assertions,
		errors: [],
	};
}
