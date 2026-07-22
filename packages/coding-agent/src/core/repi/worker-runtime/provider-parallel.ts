/** Parallel provider worker matrix verification. */
import type { RepiParallelProviderWorkerMatrixV1 } from "./types.ts";

export function verifyParallelProviderWorkerMatrixV1(report: RepiParallelProviderWorkerMatrixV1): {
	ok: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	if (report.kind !== "ParallelProviderWorkerMatrixV1") errors.push("parallel_provider_matrix_kind_invalid");
	if ((report as any).schemaVersion !== 1 && (report as any).schemaVersion !== undefined)
		errors.push("parallel_provider_matrix_schema_version_invalid");
	if (!report.poolId) errors.push("parallel_provider_matrix_pool_missing");
	if (report.maxConcurrency < 1) errors.push("parallel_provider_matrix_max_concurrency_invalid");
	if (report.peakConcurrency > report.maxConcurrency)
		errors.push("parallel_provider_matrix_peak_concurrency_exceeded");
	if (!report.workers?.length) errors.push("parallel_provider_matrix_workers_missing");
	if (!report.isolatedHome?.includes(".repi") || report.isolatedHome.includes("/.pi/"))
		errors.push("parallel_provider_matrix_isolated_home_invalid");
	for (const worker of report.workers ?? []) {
		if (!worker.workerId) errors.push("parallel_provider_matrix_worker_id_missing");
		const assertions = worker.assertions ?? ({} as any);
		if (!assertions.childProcessLaunched)
			errors.push(`parallel_provider_matrix_child_not_launched:${worker.workerId}`);
		if (!assertions.requestSeen) errors.push(`parallel_provider_matrix_request_missing:${worker.workerId}`);
		if (!assertions.endpointMatched) errors.push(`parallel_provider_matrix_endpoint_mismatch:${worker.workerId}`);
		if (!assertions.modelMatched) errors.push(`parallel_provider_matrix_model_mismatch:${worker.workerId}`);
		if (!assertions.apiKeyEnvRefOnly) errors.push(`parallel_provider_matrix_api_key_not_env_ref:${worker.workerId}`);
		if (!assertions.authorizationFromEnv)
			errors.push(`parallel_provider_matrix_authorization_not_env:${worker.workerId}`);
		if (!assertions.requestLogCaptured)
			errors.push(`parallel_provider_matrix_request_log_missing:${worker.workerId}`);
		if (!assertions.transcriptCaptured) errors.push(`parallel_provider_matrix_transcript_missing:${worker.workerId}`);
		if (!assertions.noLiteralSecrets) errors.push(`parallel_provider_matrix_literal_secret:${worker.workerId}`);
		if (!assertions.noPiHomeImport) errors.push(`parallel_provider_matrix_pi_home_import:${worker.workerId}`);
		if (!assertions.noUpdateBanner) errors.push(`parallel_provider_matrix_update_banner:${worker.workerId}`);
		if (worker.mode === "pass") {
			if (!assertions.exitOkWhenExpected) errors.push(`parallel_provider_matrix_exit_not_ok:${worker.workerId}`);
			if (!assertions.successMarkerObserved)
				errors.push(`parallel_provider_matrix_success_marker_missing:${worker.workerId}`);
		}
		if (worker.mode === "failure" && !assertions.exitFailedWhenExpected)
			errors.push(`parallel_provider_matrix_failure_exit_missing:${worker.workerId}`);
		if (worker.mode === "timeout" && !assertions.timeoutCancelled)
			errors.push(`parallel_provider_matrix_timeout_not_cancelled:${worker.workerId}`);
		if (
			(worker.mode === "failure" || worker.status === "repair_queued") &&
			assertions.providerWorkerFailureRepairLinked === false
		)
			errors.push(`parallel_provider_matrix_failure_repair_unlinked:${worker.workerId}`);
	}
	if (!report.claimMerge?.claimAwareProviderWorkerMerge)
		errors.push("parallel_provider_matrix_claim_aware_merge_missing");
	if (!report.failureRepairValidation?.ok) errors.push("parallel_provider_matrix_failure_repair_validation_failed");
	return { ok: errors.length === 0, errors };
}
