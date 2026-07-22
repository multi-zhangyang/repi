/** Worker retry handoff merge summary. */
// Landmark: buildWorkerRetryHandoffMergeSummaryV1

import { uniqueNonEmpty } from "../../text.ts";
import type { RepiWorkerRetryHandoffClosureV1, RepiWorkerRetryHandoffMergeSummaryV1 } from "../types.ts";
import { buildWorkerRetryHandoffClosureRowsV1 } from "./build.ts";
import { buildWorkerRetryHandoffMergeAssertions } from "./build-merge-assertions.ts";
import { finalizeWorkerRetryHandoffMergeSummary } from "./build-merge-finalize.ts";

export function buildWorkerRetryHandoffMergeSummaryV1(
	report: RepiWorkerRetryHandoffClosureV1,
): RepiWorkerRetryHandoffMergeSummaryV1 {
	const workerClosures = buildWorkerRetryHandoffClosureRowsV1(report);
	const retryQueuedWorkers = uniqueNonEmpty(
		report.workers
			.filter((worker: any) => worker.retryState === "retry_queued")
			.map((worker: any) => worker.workerId),
		80,
	);
	const handoffRecoveredWorkers = uniqueNonEmpty(
		report.workers
			.filter((worker: any) => worker.retryState === "handoff_recovered")
			.map((worker: any) => worker.workerId),
		80,
	);
	const exhaustedEscalatedWorkers = uniqueNonEmpty(
		report.workers
			.filter((worker: any) => worker.retryState === "exhausted_escalated")
			.map((worker: any) => worker.workerId),
		80,
	);
	const unresolvedWorkers = uniqueNonEmpty(
		[
			...report.merge.unresolvedWorkers,
			...report.workers
				.filter((worker: any) => worker.retryState === "blocked_without_closure")
				.map((worker: any) => worker.workerId),
		],
		80,
	);
	const resolvedCollisions = uniqueNonEmpty(
		report.merge.collisions
			.filter((collision: any) => collision.status === "resolved")
			.map((collision: any) => collision.mergeKey),
		80,
	);
	const unresolvedCollisions = uniqueNonEmpty(
		report.merge.collisions
			.filter((collision: any) => collision.status !== "resolved")
			.map((collision: any) => collision.mergeKey),
		80,
	);
	const claimRefs = uniqueNonEmpty(
		report.workers.flatMap((worker: any) => worker.claimRefs),
		120,
	);
	const sourceArtifacts = uniqueNonEmpty(
		workerClosures.flatMap((worker: any) => worker.evidenceRefs),
		160,
	);
	const allWorkerRefsPreserved = report.workers.every((worker: any) => {
		const artifacts = new Set(worker.sourceArtifacts);
		return [...worker.retryQueueRefs, ...worker.handoffRefs, ...worker.repairRefs].every((ref: any) =>
			artifacts.has(ref),
		);
	});
	const handoffEvidenceBound =
		report.assertions.handoffRefsBoundToClaims &&
		report.workers.every((worker: any) => {
			if (!worker.handoffRefs.length) return true;
			return worker.claimRefs.length > 0 && worker.mergeKeys.some((key: any) => worker.claimRefs.includes(key));
		});
	const retryBudgetVisible =
		report.assertions.retryBudgetsConsistent &&
		report.workers.every(
			(worker: any) =>
				Number.isFinite(worker.attempt) &&
				Number.isFinite(worker.maxAttempts) &&
				Number.isFinite(worker.retryRemaining) &&
				worker.attempt <= worker.maxAttempts &&
				worker.retryRemaining === Math.max(0, worker.maxAttempts - worker.attempt),
		);
	const assertions = buildWorkerRetryHandoffMergeAssertions({
		report,
		unresolvedWorkers,
		unresolvedCollisions,
		sourceArtifacts,
		allWorkerRefsPreserved,
		handoffEvidenceBound,
		retryBudgetVisible,
	});
	return finalizeWorkerRetryHandoffMergeSummary({
		report,
		workerClosures,
		retryQueuedWorkers,
		handoffRecoveredWorkers,
		exhaustedEscalatedWorkers,
		unresolvedWorkers,
		resolvedCollisions,
		unresolvedCollisions,
		claimRefs,
		sourceArtifacts,
		assertions,
	});
}
