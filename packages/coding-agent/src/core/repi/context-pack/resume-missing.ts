/** Exact resume fallback when context pack is missing. */

import { buildContextPack } from "../kernel/factory-hooks/loaders-context.ts";
import { appendCompactResumeTransition, buildCompactResumeLedgerV2Report } from "./deps.ts";
import type { ContextPackArtifact, ContextResumeVerification } from "./types.ts";

export function buildMissingExactResumeContextPack(params: {
	target?: string;
	verification: ContextResumeVerification;
}): ContextPackArtifact {
	const fallback = buildContextPack({ target: params.target, mode: "resume", recordCompactResume: false });
	fallback.exactResumeVerification = params.verification;
	fallback.resumeQueueStatus = "blocked";
	fallback.closure = {
		status: "blocked",
		closedAt: new Date().toISOString(),
		reason: params.verification.blocked.join("; "),
		verifiedBy: "re_context exact resume",
	};
	appendCompactResumeTransition({
		from: "queued",
		to: "blocked",
		command: "re_context resume",
		reason: params.verification.blocked.join("; ") || "context pack not found",
		idempotencyKey: fallback.idempotencyKey,
		contextPath: fallback.contextPath,
		contextSha256: fallback.contextSha256,
		maxAttempts: Math.max(1, fallback.autonomousBudget.maxTurns),
	});
	fallback.compactResumeLedgerV2 = buildCompactResumeLedgerV2Report({ write: true });
	return fallback;
}
