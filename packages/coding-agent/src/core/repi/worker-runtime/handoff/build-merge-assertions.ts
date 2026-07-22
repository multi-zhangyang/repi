/** Worker retry handoff merge assertion computation. */
// Landmark: buildWorkerRetryHandoffMergeAssertions

export function buildWorkerRetryHandoffMergeAssertions(input: {
	report: any;
	unresolvedWorkers: string[];
	unresolvedCollisions: string[];
	sourceArtifacts: string[];
	allWorkerRefsPreserved: boolean;
	handoffEvidenceBound: boolean;
	retryBudgetVisible: boolean;
}): {
	noUnresolvedWorkers: boolean;
	collisionsResolved: boolean;
	allFailuresClosed: boolean;
	handoffEvidenceBound: boolean;
	retryBudgetVisible: boolean;
	sourceArtifactsPreserved: boolean;
} {
	const {
		report,
		unresolvedWorkers,
		unresolvedCollisions,
		sourceArtifacts,
		allWorkerRefsPreserved,
		handoffEvidenceBound,
		retryBudgetVisible,
	} = input;
	return {
		noUnresolvedWorkers: unresolvedWorkers.length === 0,
		collisionsResolved: unresolvedCollisions.length === 0 && report.assertions.mergeCollisionsResolved,
		allFailuresClosed:
			report.errors.length === 0 &&
			report.assertions.failedWorkersHaveRetryOrHandoff &&
			report.workers.every((worker: any) => worker.retryState !== "blocked_without_closure"),
		handoffEvidenceBound,
		retryBudgetVisible,
		sourceArtifactsPreserved:
			report.assertions.sourceArtifactsPreserved &&
			sourceArtifacts.length > 0 &&
			report.workers.every((worker: any) => worker.sourceArtifacts.length > 0) &&
			allWorkerRefsPreserved,
	};
}
