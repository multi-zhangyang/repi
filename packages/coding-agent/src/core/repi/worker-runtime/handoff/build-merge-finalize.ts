/** Finalize worker retry handoff merge summary object. */
import { uniqueNonEmpty } from "../../text.ts";
import { workerHandoffReverseNext } from "./build-merge-reverse.ts";

export function finalizeWorkerRetryHandoffMergeSummary(params: {
	report: any;
	workerClosures: any[];
	retryQueuedWorkers: string[];
	handoffRecoveredWorkers: string[];
	exhaustedEscalatedWorkers: string[];
	unresolvedWorkers: string[];
	resolvedCollisions: string[];
	unresolvedCollisions: string[];
	claimRefs: string[];
	sourceArtifacts: string[];
	assertions: Record<string, boolean>;
}): any {
	const {
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
	} = params;
	const reverseNext = workerHandoffReverseNext({
		workerClosures,
		unresolvedWorkers,
		unresolvedCollisions,
	});
	const nextActions = uniqueNonEmpty(
		[
			...reverseNext,
			...workerClosures.filter((worker: any) => worker.closure !== "passed").map((worker: any) => worker.nextAction),
			...unresolvedWorkers.flatMap((workerId: any) => [
				`re_supervisor repair worker=${workerId}`,
				`re_swarm retry worker=${workerId}`,
			]),
			...unresolvedCollisions.map((mergeKey: any) => `re_supervisor repair mergeKey=${mergeKey}`),
			...(report.errors.length ? ["re_supervisor review retry_handoff_errors"] : []),
			...(!assertions.retryBudgetVisible ? ["re_swarm inspect retry-budget"] : []),
			...(!assertions.handoffEvidenceBound ? ["re_evidence bind handoff-refs-to-claims"] : []),
			...(!assertions.sourceArtifactsPreserved ? ["re_evidence collect source-artifacts"] : []),
			...(Object.values(assertions).every(Boolean) ? ["re_swarm merge && re_supervisor review"] : []),
		],
		80,
	);
	return {
		kind: "WorkerRetryHandoffMergeSummaryV1",
		schemaVersion: 1,
		closureId: report.closureId,
		poolId: report.poolId,
		status: Object.values(assertions).every(Boolean) ? "pass" : "blocked",
		workerClosures,
		retryQueuedWorkers,
		handoffRecoveredWorkers,
		exhaustedEscalatedWorkers,
		unresolvedWorkers,
		resolvedCollisions,
		unresolvedCollisions,
		nextActions,
		claimRefs,
		sourceArtifacts,
		assertions,
	};
}
