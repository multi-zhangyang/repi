/** Worker retry handoff closure rows. */
/** Build worker retry handoff closure/merge summary artifacts. */

import { uniqueNonEmpty } from "../../text.ts";
import type { RepiWorkerRetryHandoffClosureRowV1, RepiWorkerRetryHandoffClosureV1 } from "../types.ts";
import { workerRetryHandoffClosureNextAction, workerRetryHandoffClosureState } from "./state.ts";

export function buildWorkerRetryHandoffClosureRowsV1(
	report: RepiWorkerRetryHandoffClosureV1,
): RepiWorkerRetryHandoffClosureRowV1[] {
	return report.workers.map((worker: any) => {
		const closure = workerRetryHandoffClosureState(worker);
		const evidenceRefs = uniqueNonEmpty(
			[
				...worker.sourceArtifacts,
				...worker.retryQueueRefs,
				...worker.handoffRefs,
				...worker.repairRefs,
				...worker.claimRefs,
				...worker.mergeKeys,
			],
			80,
		);
		const nextAction = workerRetryHandoffClosureNextAction({ workerId: worker.workerId, closure });
		return {
			workerId: worker.workerId,
			status: worker.status,
			retryState: worker.retryState,
			attempt: worker.attempt,
			maxAttempts: worker.maxAttempts,
			retryRemaining: worker.retryRemaining,
			timedOut: worker.timedOut,
			cancelledAt: worker.cancelledAt,
			closure,
			retryQueueRefs: worker.retryQueueRefs,
			handoffRefs: worker.handoffRefs,
			repairRefs: worker.repairRefs,
			claimRefs: worker.claimRefs,
			mergeKeys: worker.mergeKeys,
			evidenceRefs,
			nextAction,
			summary: [
				`worker=${worker.workerId}`,
				`status=${worker.status}`,
				`retry_state=${worker.retryState}`,
				`attempt=${worker.attempt}/${worker.maxAttempts}`,
				`remaining=${worker.retryRemaining}`,
				`timed_out=${worker.timedOut}`,
				`cancelled=${worker.cancelledAt ?? "none"}`,
				`closure=${closure}`,
				`evidence_refs=${evidenceRefs.length}`,
				`next=${nextAction}`,
			].join(" "),
		};
	});
}

/** reverse: merge summary nextActions can include capture gates */
