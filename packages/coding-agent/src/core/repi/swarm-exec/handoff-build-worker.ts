/** Per-worker retry handoff closure row. */

import { uniqueNonEmpty } from "../text.ts";
import { swarmHandoffReverseRepairRefs } from "./handoff-build-reverse.ts";
import {
	workerHandoffRefsForSwarmWorker,
	workerPoolStatusFailed,
	workerPoolStatusPassed,
	workerRepairRefsForSwarmWorker,
	workerRetryHandoffState,
	workerRetryQueueRefsForSwarmWorker,
} from "./pure.ts";

type SwarmArtifact = any;

export function buildSwarmWorkerRetryHandoffRow(swarm: SwarmArtifact, worker: any, pool: any): any {
	const retryQueueRefs = workerRetryQueueRefsForSwarmWorker(swarm, worker.workerId);
	const handoffRefs = workerHandoffRefsForSwarmWorker(swarm, worker.workerId);
	const baseRepairRefs = workerRepairRefsForSwarmWorker(swarm, worker.workerId);
	const repairRefs = swarmHandoffReverseRepairRefs({
		swarm,
		worker,
		baseRepairRefs,
	});
	const mergeKeys = Array.isArray(worker.mergeKey) ? worker.mergeKey : [worker.mergeKey];
	const collisionEvidenceRefs = pool.mergeProtocol.conflicts
		.filter((conflict: any) => conflict.workers.includes(worker.workerId) || mergeKeys.includes(conflict.mergeKey))
		.flatMap((conflict: any) => conflict.evidenceRefs);
	const sourceArtifacts = uniqueNonEmpty(
		[
			...worker.claimRefs,
			...mergeKeys,
			...collisionEvidenceRefs,
			...retryQueueRefs,
			...handoffRefs,
			...repairRefs,
			worker.stdoutPath,
			worker.stderrPath,
			swarm.claimLedgerPath,
			swarm.workerChildSessionRuntimePath,
		],
		40,
	);
	const timedOut =
		worker.status === "timeout" ||
		(worker.endedAt && worker.startedAt
			? Date.parse(worker.endedAt) - Date.parse(worker.startedAt) > worker.timeoutMs
			: false);
	const retryRemaining = Math.max(0, worker.maxAttempts - worker.attempt);
	const isFailure = workerPoolStatusFailed(worker.status);
	const exhausted =
		worker.status === "exhausted" || worker.retryBudget.exhausted || worker.attempt >= worker.maxAttempts;
	const retryState = workerRetryHandoffState({ worker, retryQueueRefs, handoffRefs, repairRefs });
	const assertions = {
		attemptBounded: worker.attempt <= worker.maxAttempts,
		retryBudgetConsistent:
			worker.retryBudget.attempt === worker.attempt &&
			worker.retryBudget.maxAttempts === worker.maxAttempts &&
			worker.retryBudget.remaining === retryRemaining &&
			worker.retryBudget.exhausted === exhausted,
		timeoutCancellationRecorded: !timedOut || Boolean(worker.cancelledAt),
		failureHasRetryOrHandoff:
			!isFailure || retryQueueRefs.length > 0 || handoffRefs.length > 0 || repairRefs.length > 0,
		exhaustionEscalated: !exhausted || workerPoolStatusPassed(worker.status) || repairRefs.length > 0,
		handoffBoundToClaim: handoffRefs.length === 0 || worker.claimRefs.length > 0,
		sourceArtifactsPreserved: sourceArtifacts.length > 0,
	};
	return {
		workerId: worker.workerId,
		role: worker.role,
		packetId: worker.packetId,
		status: worker.status,
		attempt: worker.attempt,
		maxAttempts: worker.maxAttempts,
		retryRemaining,
		retryState,
		timeoutMs: worker.timeoutMs,
		timedOut,
		cancelledAt: worker.cancelledAt,
		retryQueueRefs,
		handoffRefs,
		repairRefs,
		claimRefs: worker.claimRefs,
		sourceArtifacts,
		mergeKeys,
		assertions,
	};
}
