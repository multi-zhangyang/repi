/** Provider matrix + child-process probe verification. */
import type { RepiProviderRuntimeMatrixV1, RepiWorkerProviderChildProcessProbeV1 } from "./types.ts";

export function verifyWorkerProviderChildProcessProbe(probe: RepiWorkerProviderChildProcessProbeV1): string[] {
	const errors: string[] = [];
	if (probe.kind !== "WorkerProviderChildProcessProbeV1" || probe.status !== "pass")
		errors.push("provider_child_process_probe_not_pass");
	if (!probe.assertions.openAICompatibleRequestSeen) errors.push("provider_child_process_request_missing");
	if (!probe.assertions.modelMatched) errors.push("provider_child_process_model_mismatch");
	if (!probe.assertions.stdoutMarkerObserved) errors.push("provider_child_process_stdout_marker_missing");
	if (!probe.assertions.apiKeyEnvRefOnly) errors.push("provider_child_process_api_key_not_env_ref");
	if (!probe.assertions.authorizationFromEnv) errors.push("provider_child_process_authorization_not_env");
	if (!probe.assertions.transcriptCaptured || !probe.transcriptSha256)
		errors.push("provider_child_process_transcript_missing");
	if (!probe.assertions.noPiHomeImport) errors.push("provider_child_process_imported_pi_home");
	if (!probe.assertions.noUpdateBanner) errors.push("provider_child_process_update_banner");
	if (!probe.assertions.noLiteralSecrets) errors.push("provider_child_process_literal_secret");
	if (!probe.isolatedHome.includes(".repi") || probe.isolatedHome.includes("/.pi/"))
		errors.push("provider_child_process_isolated_home_invalid");
	if (probe.request.path !== "/v1/chat/completions") errors.push("provider_child_process_endpoint_invalid");
	if (probe.request.model !== probe.modelId) errors.push("provider_child_process_request_model_invalid");
	return errors;
}

export function verifyProviderRuntimeMatrixV1(matrix: RepiProviderRuntimeMatrixV1): { ok: boolean; errors: string[] } {
	const errors: string[] = [];
	if (matrix.kind !== "ProviderRuntimeMatrixV1") errors.push("provider_runtime_matrix_kind_invalid");
	if ((matrix as any).schemaVersion !== 1 && (matrix as any).schemaVersion !== undefined)
		errors.push("provider_runtime_matrix_schema_version_invalid");
	if (!(matrix as any).modelsJsonPath) errors.push("provider_runtime_matrix_models_json_missing");
	if (!(matrix as any).requestLogPath) errors.push("provider_runtime_matrix_request_log_missing");
	if (!matrix.isolatedHome?.includes(".repi") || matrix.isolatedHome.includes("/.pi/"))
		errors.push("provider_runtime_matrix_isolated_home_invalid");
	if (!matrix.cases?.length) errors.push("provider_runtime_matrix_cases_missing");
	for (const item of matrix.cases ?? []) {
		const caseId = (item as any).caseId ?? "unknown";
		if ((item as any).kind !== "ProviderRuntimeMatrixCaseV1")
			errors.push(`provider_runtime_matrix_case_kind_invalid:${caseId}`);
		if (!(item as any).providerName) errors.push(`provider_runtime_matrix_provider_missing:${caseId}`);
		if (!(item as any).modelId) errors.push(`provider_runtime_matrix_model_missing:${caseId}`);
		const assertions = (item as any).assertions ?? {};
		if ((item as any).status === "pass") {
			if (!assertions.exitOk) errors.push(`provider_runtime_matrix_exit_not_ok:${caseId}`);
			if (!assertions.requestSeen) errors.push(`provider_runtime_matrix_request_missing:${caseId}`);
			if (!assertions.modelMatched) errors.push(`provider_runtime_matrix_model_mismatch:${caseId}`);
			if (!assertions.stdoutMarkerObserved) errors.push(`provider_runtime_matrix_stdout_marker_missing:${caseId}`);
			if (!assertions.apiKeyEnvRefOnly) errors.push(`provider_runtime_matrix_api_key_not_env_ref:${caseId}`);
			if (!assertions.authorizationFromEnv) errors.push(`provider_runtime_matrix_authorization_not_env:${caseId}`);
			if (!assertions.transcriptCaptured) errors.push(`provider_runtime_matrix_transcript_missing:${caseId}`);
			if (!assertions.requestLogCaptured) errors.push(`provider_runtime_matrix_request_log_missing:${caseId}`);
			if (!assertions.noLiteralSecrets) errors.push(`provider_runtime_matrix_literal_secret:${caseId}`);
			if (!assertions.noPiHomeImport) errors.push(`provider_runtime_matrix_pi_home_import:${caseId}`);
			if (!assertions.noUpdateBanner) errors.push(`provider_runtime_matrix_update_banner:${caseId}`);
		}
		for (const error of (item as any).errors ?? [])
			errors.push(`provider_runtime_matrix_case_error:${caseId}:${error}`);
	}
	if ((matrix as any).listModels?.status === "pass" && !(matrix as any).listModels?.providers?.length)
		errors.push("provider_runtime_matrix_list_models_empty");
	return { ok: errors.length === 0, errors };
}
