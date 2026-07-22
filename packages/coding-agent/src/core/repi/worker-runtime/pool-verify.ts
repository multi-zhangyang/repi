/** Worker runtime pool verification. */

import { uniqueNonEmpty } from "../text.ts";
import { workerRuntimePoolEvidenceContract } from "./pool-contract.ts";
import { collectWorkerRuntimePoolMergeErrors } from "./pool-verify-merge.ts";
import { collectWorkerRuntimePoolWorkerErrors } from "./pool-verify-workers.ts";
import type { RepiWorkerRuntimePoolV1 } from "./types.ts";

export function verifyWorkerRuntimePool(pool: RepiWorkerRuntimePoolV1): {
	ok: boolean;
	errors: string[];
	evidenceContract: string[];
} {
	const maxConcurrency = Math.max(1, Math.floor(pool.maxConcurrency));
	const workerResult = collectWorkerRuntimePoolWorkerErrors(pool);
	const errors = [
		...workerResult.errors,
		...collectWorkerRuntimePoolMergeErrors(
			pool,
			workerResult.runtimeIntervals,
			maxConcurrency,
			workerResult.activePoints,
		),
	];
	return {
		ok: errors.length === 0,
		errors: uniqueNonEmpty(errors, 80),
		evidenceContract: workerRuntimePoolEvidenceContract(),
	};
}
