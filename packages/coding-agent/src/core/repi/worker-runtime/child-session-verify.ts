/** Verify worker child-session runtime batch. */

import { uniqueNonEmpty } from "../text.ts";
import { workerChildSessionToWorkerRuntimePoolBridge } from "./child-session-bridge.ts";
import { workerChildRuntimeStatusMatchesPoolStatus } from "./child-session-status.ts";
import { envRefName, sameStringSet } from "./helpers.ts";
import { verifyWorkerRuntimePool } from "./pool.ts";
import { verifyWorkerProviderChildProcessProbe } from "./provider.ts";
import type { RepiWorkerChildSessionRuntimeBatchV1 } from "./types.ts";

export function verifyWorkerChildSessionRuntimeBatch(batch: RepiWorkerChildSessionRuntimeBatchV1): {
	ok: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	if (batch.kind !== "WorkerChildSessionRuntimeBatchV1") errors.push("child_session_batch_kind_invalid");
	if (batch.schemaVersion !== 1) errors.push("child_session_batch_schema_version_invalid");
	if (!batch.sessions.length) errors.push("child_session_sessions_missing");
	if (batch.launchPolicy.command !== "repi") errors.push("child_session_command_not_repi");
	if (!batch.launchPolicy.args.includes("--recon")) errors.push("child_session_missing_recon_arg");
	if (!batch.launchPolicy.isolatedHome.includes(".repi") || batch.launchPolicy.isolatedHome.includes("/.pi/"))
		errors.push("child_session_isolated_home_invalid");
	if (batch.launchPolicy.importPiAuth !== false) errors.push("child_session_import_pi_auth_not_false");
	if (!batch.launchPolicy.updateChecksDisabled) errors.push("child_session_update_checks_not_disabled");
	if (!batch.launchPolicy.telemetryDisabled) errors.push("child_session_telemetry_not_disabled");
	if (batch.poolBridge?.kind !== "WorkerRuntimePoolV1Bridge") errors.push("child_session_pool_bridge_kind_invalid");
	if (batch.poolBridge?.poolId !== batch.poolId) errors.push("child_session_pool_bridge_pool_mismatch");
	if (!batch.poolBridge?.claimAwareMerge) errors.push("child_session_claim_aware_merge_missing");
	if (!batch.poolBridge?.childSessionRuntimeCaptured) errors.push("child_session_runtime_not_captured");
	const sessionWorkerIds = batch.sessions.map((session: any) => session.workerId);
	if (!sameStringSet(batch.poolBridge?.workerIds ?? [], sessionWorkerIds))
		errors.push("child_session_pool_bridge_workerIds_mismatch");
	if (batch.poolBridge?.childProcessRuntimeCaptured) {
		const probe = batch.childProcessProbe;
		if (!probe) errors.push("child_process_probe_missing");
		else {
			if (probe.kind !== "WorkerChildProcessProbeV1" || probe.status !== "pass")
				errors.push("child_process_probe_not_pass");
			if (!probe.assertions.repiCommandExecuted) errors.push("child_process_probe_command_not_repi");
			if (
				!probe.assertions.isolatedRepiHome ||
				!probe.isolatedHome.includes(".repi") ||
				probe.isolatedHome.includes("/.pi/")
			)
				errors.push("child_process_probe_isolated_home_invalid");
			if (!probe.assertions.noPiHomeImport) errors.push("child_process_probe_imported_pi_home");
			if (!probe.assertions.updateChecksDisabled) errors.push("child_process_probe_update_checks_not_disabled");
			if (!probe.assertions.telemetryDisabled) errors.push("child_process_probe_telemetry_not_disabled");
			if (!probe.assertions.noLiteralSecrets) errors.push("child_process_probe_literal_secret");
			if (!probe.assertions.stdoutCaptured || !probe.stdoutSha256) errors.push("child_process_probe_stdout_missing");
			// reverse: surface missing reverse capture signal when probe text suggests reverse work without proof
			const reverseHint = /native|pwn|frida|gdb|r2|mobile|firmware|malware|proof|bind_ready/i.test(
				`${probe.stdoutSha256 ?? ""} ${JSON.stringify(probe.assertions ?? {})}`,
			);
			if (reverseHint && (probe as any).reverseCaptureSignal === false) {
				errors.push("child_process_probe_reverse_capture_signal_false");
			}
		}
	}
	if (batch.poolBridge?.providerChildProcessRuntimeCaptured || batch.providerChildProcessProbe) {
		const probe = batch.providerChildProcessProbe;
		if (!probe) errors.push("provider_child_process_probe_missing");
		else errors.push(...verifyWorkerProviderChildProcessProbe(probe));
	}
	for (const secret of ["GITHUB_TOKEN", "GITHUB_TOKEN_FOR_PUSH", "ANTHROPIC_AUTH_TOKEN"]) {
		if (batch.launchPolicy.envAllowlist.includes(secret)) errors.push(`child_session_secret_allowed:${secret}`);
		if (!batch.launchPolicy.envDenylist.includes(secret)) errors.push(`child_session_secret_not_denied:${secret}`);
	}
	const sessionDirs = new Set<string>();
	for (const session of batch.sessions) {
		if (!session.provider.apiKeyRef.startsWith("$"))
			errors.push(`child_session_literal_api_key:${session.sessionId}`);
		if (!session.provider.baseUrlRef.startsWith("$"))
			errors.push(`child_session_literal_base_url:${session.sessionId}`);
		for (const ref of [session.provider.apiKeyRef, session.provider.baseUrlRef]) {
			const name = envRefName(ref);
			if (!name) continue;
			if (!batch.launchPolicy.envAllowlist.includes(name))
				errors.push(`child_session_provider_env_not_allowlisted:${session.sessionId}:${name}`);
			if (batch.launchPolicy.envDenylist.includes(name))
				errors.push(`child_session_provider_env_denied:${session.sessionId}:${name}`);
		}
		if (sessionDirs.has(session.runtime.sessionDir))
			errors.push(`child_session_duplicate_session_dir:${session.sessionId}`);
		sessionDirs.add(session.runtime.sessionDir);
		if (!session.poolBridge?.poolId || session.poolBridge.poolId !== batch.poolId)
			errors.push(`child_session_missing_pool_bridge:${session.sessionId}`);
		if (session.retryBudget.remaining !== Math.max(0, session.maxAttempts - session.attempt))
			errors.push(`child_session_retry_remaining_inconsistent:${session.sessionId}`);
		if (session.retryBudget.exhausted && ["queued", "running"].includes(session.runtime.status))
			errors.push(`child_session_exhausted_still_running:${session.sessionId}`);
		if (session.runtime.status === "timeout" && !session.runtime.cancelledAt)
			errors.push(`child_session_timeout_without_cancel:${session.sessionId}`);
		if (
			!workerChildRuntimeStatusMatchesPoolStatus(session.runtime.status, session.poolBridge.workerRuntimePoolStatus)
		)
			errors.push(`child_session_pool_status_mismatch:${session.sessionId}`);
	}
	const bridgePool = workerChildSessionToWorkerRuntimePoolBridge(batch);
	const bridgeValidation = verifyWorkerRuntimePool(bridgePool);
	if (!bridgeValidation.ok)
		errors.push(...bridgeValidation.errors.map((error: any) => `child_session_pool_bridge:${error}`));
	return { ok: errors.length === 0, errors: uniqueNonEmpty(errors, 80) };
}
