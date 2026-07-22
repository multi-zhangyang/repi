/** Compact-resume transitions for exact context pack resume. */
import { createHash } from "node:crypto";
import { appendCompactResumeTransition, buildCompactResumeLedgerV2Report } from "./deps.ts";

export function applyExactResumeTransitions(params: {
	source: any;
	resolvedPath?: string;
	verificationBlocked: string[];
}): { sourceIdempotencyKey: string; compactResumeLedgerV2: any } {
	const { source, resolvedPath, verificationBlocked } = params;
	const sourceIdempotencyKey =
		source.idempotencyKey ??
		createHash("sha256")
			.update(`${source.sessionId ?? "session"}\n${resolvedPath}\n${source.nextCommands?.join("\n") ?? ""}`)
			.digest("hex");
	const maxAttempts = Math.max(
		1,
		source.resumeContract?.budget.maxResumeTurns ?? source.autonomousBudget?.maxTurns ?? 3,
	);
	appendCompactResumeTransition({
		to: "running",
		command: "re_context resume",
		reason: "exact context resume verification started",
		idempotencyKey: sourceIdempotencyKey,
		contextPath: resolvedPath,
		contextSha256: source.contextSha256,
		maxAttempts,
	});
	appendCompactResumeTransition({
		to: verificationBlocked.length ? "blocked" : "done",
		command: "re_context resume",
		reason: verificationBlocked.length ? verificationBlocked.join("; ") : "exact context resume verified",
		idempotencyKey: sourceIdempotencyKey,
		contextPath: resolvedPath,
		contextSha256: source.contextSha256,
		maxAttempts,
	});
	return {
		sourceIdempotencyKey,
		compactResumeLedgerV2: buildCompactResumeLedgerV2Report({ write: true }),
	};
}
