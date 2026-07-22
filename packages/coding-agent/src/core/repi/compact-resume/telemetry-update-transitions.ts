/** Compact-resume telemetry transition ledger updates. */
import {
	appendCompactResumeTransition,
	buildCompactResumeLedgerV2Report,
	compactResumeAttemptForKey,
	readCompactResumeTransitions,
} from "./deps.ts";
import type { ReconCompactionResumeTelemetry } from "./types.ts";

export function applyCompactResumeTelemetryTransitions(params: {
	telemetry: ReconCompactionResumeTelemetry;
	commandStatus: any[];
	telemetryIdempotencyKey: string;
	contextPath?: string;
}): void {
	const { telemetry, commandStatus, telemetryIdempotencyKey, contextPath } = params;
	if (commandStatus.some((row: any) => row.outputSha256 || row.status !== "queued")) {
		appendCompactResumeTransition({
			to: "running",
			command: "compact_resume_telemetry",
			reason: "operator/proof-loop execution updated compact resume queue",
			idempotencyKey: telemetryIdempotencyKey,
			contextPath,
			maxAttempts: Math.max(1, commandStatus.length || 3),
		});
	}
	const blockedRows = commandStatus.filter((row: any) => row.status === "blocked");
	const queuedRows = commandStatus.filter((row: any) => row.status === "queued");
	if (blockedRows.length) {
		appendCompactResumeTransition({
			to: "blocked",
			command: "compact_resume_telemetry",
			reason: `blocked compact resume commands: ${blockedRows.map((row: any) => row.command).join(", ")}`,
			idempotencyKey: telemetryIdempotencyKey,
			contextPath,
			maxAttempts: Math.max(1, commandStatus.length || 3),
		});
	} else if (commandStatus.length && queuedRows.length === 0 && telemetry.proofLoopEntered) {
		appendCompactResumeTransition({
			to: "done",
			command: "compact_resume_telemetry",
			reason: "all compact resume commands completed and proof-loop entered",
			idempotencyKey: telemetryIdempotencyKey,
			contextPath,
			maxAttempts: Math.max(1, commandStatus.length || 3),
		});
	} else if (
		queuedRows.length &&
		compactResumeAttemptForKey(readCompactResumeTransitions().transitions, telemetryIdempotencyKey) >
			Math.max(1, commandStatus.length || 3)
	) {
		appendCompactResumeTransition({
			to: "exhausted",
			command: "compact_resume_telemetry",
			reason: `auto-resume budget exhausted with queued commands: ${queuedRows.map((row: any) => row.command).join(", ")}`,
			idempotencyKey: telemetryIdempotencyKey,
			contextPath,
			maxAttempts: Math.max(1, commandStatus.length || 3),
		});
	}
	buildCompactResumeLedgerV2Report({ write: true });
}

/** reverse: mark proof/bind progress when reverse capture runners complete */
export function markReverseCaptureTelemetryProgress(telemetry: any, commandStatus: any[]): void {
	const reverseCaptureDone = commandStatus.some(
		(row: any) =>
			row.status === "done" &&
			/re_(?:native_runtime|live_browser|js_signing|web_authz_state|mobile_runtime|exploit_lab|domain_proof_exit|runtime_adapter)\b/i.test(
				row.command,
			),
	);
	if (reverseCaptureDone) {
		telemetry.reverseCaptureProgress = "partial_or_strong_candidate";
		telemetry.reverseProofGate = "require_proof_exit_before_claim";
	}
}
