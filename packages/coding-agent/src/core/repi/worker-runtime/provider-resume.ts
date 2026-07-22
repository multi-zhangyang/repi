/** Remote long-run + cross-session resume verification. */
import type { RepiCrossSessionResumeLiveV1, RepiRemoteProviderLongRunV1 } from "./types.ts";

export function verifyRemoteProviderLongRunV1(report: RepiRemoteProviderLongRunV1): { ok: boolean; errors: string[] } {
	const errors: string[] = [];
	if (report.kind !== "RemoteProviderLongRunV1") errors.push("remote_provider_long_run_kind_invalid");
	if (report.mode === "skipped") {
		if (!report.skipReason) errors.push("remote_provider_long_run_skip_reason_missing");
		return { ok: errors.length === 0, errors };
	}
	if (report.mode !== "live") errors.push("remote_provider_long_run_mode_invalid");
	if (!report.cases?.length) errors.push("remote_provider_long_run_cases_missing");
	for (const item of report.cases ?? []) {
		const caseId = (item as any).caseId ?? "unknown";
		const assertions = item.assertions ?? ({} as any);
		if (!assertions.boundedTimeout) errors.push(`remote_provider_long_run_timeout_unbounded:${caseId}`);
		if (!assertions.isolatedRepiHome) errors.push(`remote_provider_long_run_home_invalid:${caseId}`);
		if (!assertions.apiKeyEnvRefOnly) errors.push(`remote_provider_long_run_api_key_not_env_ref:${caseId}`);
		if (!assertions.noLiteralSecrets) errors.push(`remote_provider_long_run_literal_secret:${caseId}`);
		if (!assertions.noPiHomeImport) errors.push(`remote_provider_long_run_pi_home_import:${caseId}`);
		if (!assertions.noUpdateBanner) errors.push(`remote_provider_long_run_update_banner:${caseId}`);
		if (!assertions.transcriptCaptured) errors.push(`remote_provider_long_run_transcript_missing:${caseId}`);
		if (item.status === "pass") {
			if (!assertions.exitOk) errors.push(`remote_provider_long_run_exit_not_ok:${caseId}`);
			if (!assertions.stdoutNonEmpty) errors.push(`remote_provider_long_run_stdout_empty:${caseId}`);
			if (!assertions.markerObserved) errors.push(`remote_provider_long_run_marker_missing:${caseId}`);
		}
	}
	if (!report.failureRepairValidation?.ok) errors.push("remote_provider_long_run_failure_repair_validation_failed");
	return { ok: errors.length === 0, errors };
}

export function verifyCrossSessionResumeLiveV1(report: RepiCrossSessionResumeLiveV1): {
	ok: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	if (report.kind !== "CrossSessionResumeLiveV1") errors.push("cross_session_resume_kind_invalid");
	if (!report.isolatedHome?.includes(".repi") || report.isolatedHome.includes("/.pi/"))
		errors.push("cross_session_resume_isolated_home_invalid");
	if (!report.pack?.contextPath) errors.push("cross_session_resume_pack_context_missing");
	if (!report.resume?.resumedFromContextPath) errors.push("cross_session_resume_resume_context_missing");
	const exact = report.resume?.exactResumeVerification ?? ({} as any);
	if (exact.contextSha256 === "drift") errors.push("cross_session_resume_context_sha_drift");
	if (exact.contextSha256 === "missing") errors.push("cross_session_resume_context_sha_missing");
	if (exact.artifactHashes === "drift") errors.push("cross_session_resume_artifact_hash_drift");
	if (exact.artifactHashes === "missing") errors.push("cross_session_resume_artifact_hash_missing");
	const assertions = report.assertions ?? ({} as any);
	if (!assertions.crossSessionDifferent) errors.push("cross_session_resume_not_different");
	if (!assertions.packQueued) errors.push("cross_session_resume_pack_not_queued");
	if (!assertions.exactResumeLoadedByContextPath) errors.push("cross_session_resume_not_loaded_by_context_path");
	if (!assertions.resumedFromOriginalPack) errors.push("cross_session_resume_not_from_original_pack");
	if (!assertions.contextSha256Pass) errors.push("cross_session_resume_context_sha_not_pass");
	if (!assertions.artifactHashesPass) errors.push("cross_session_resume_artifact_hashes_not_pass");
	if (!assertions.scopePass) errors.push("cross_session_resume_scope_not_pass");
	if (!assertions.closureClosed) errors.push("cross_session_resume_closure_not_closed");
	if (!assertions.ledgerDone) errors.push("cross_session_resume_ledger_not_done");
	if (!assertions.providerContinuedAfterResume) errors.push("cross_session_resume_provider_not_continued");
	if (!assertions.workerContinuedAfterResume) errors.push("cross_session_resume_worker_not_continued");
	if (!assertions.envRefOnly) errors.push("cross_session_resume_env_ref_only_missing");
	if (!assertions.noPiHomeImport) errors.push("cross_session_resume_pi_home_import");
	if (!assertions.noUpdateBanner) errors.push("cross_session_resume_update_banner");
	if (!assertions.noLiteralSecrets) errors.push("cross_session_resume_literal_secret");
	if (report.providerContinuation?.status !== "pass")
		errors.push("cross_session_resume_provider_continuation_blocked");
	if (report.workerContinuation?.status !== "pass") errors.push("cross_session_resume_worker_continuation_blocked");
	return { ok: errors.length === 0, errors };
}
