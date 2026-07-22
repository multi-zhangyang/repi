/** Verify worker retry handoff closure. */

import { uniqueNonEmpty } from "../../text.ts";
import type { RepiWorkerRetryHandoffClosureV1 } from "../types.ts";
import { workerRetryHandoffClosureEvidenceContract } from "./contract.ts";
import { collectWorkerRetryHandoffMergeErrors } from "./verify-closure-merge.ts";
import { collectWorkerRetryHandoffReverseErrors } from "./verify-closure-reverse.ts";
import { collectWorkerRetryHandoffWorkerErrors } from "./verify-closure-workers.ts";

export function verifyWorkerRetryHandoffClosureV1(report: RepiWorkerRetryHandoffClosureV1): {
	ok: boolean;
	errors: string[];
	evidenceContract: string[];
} {
	const errors: string[] = [];
	if (report.kind !== "WorkerRetryHandoffClosureV1") errors.push("retry_handoff_closure_kind_invalid");
	if (report.schemaVersion !== 1) errors.push("retry_handoff_closure_schema_version_invalid");
	if (!report.poolId) errors.push("retry_handoff_closure_pool_missing");
	if (!report.workers.length) errors.push("retry_handoff_closure_workers_missing");
	const workerResult = collectWorkerRetryHandoffWorkerErrors(report);
	errors.push(...workerResult.errors);
	errors.push(
		...collectWorkerRetryHandoffMergeErrors(
			report,
			workerResult.workerById,
			workerResult.expectedRecovered,
			workerResult.expectedUnresolved,
		),
	);
	errors.push(...collectWorkerRetryHandoffReverseErrors(report));
	return {
		ok: errors.length === 0,
		errors: uniqueNonEmpty(errors, 120),
		evidenceContract: workerRetryHandoffClosureEvidenceContract(),
	};
}
