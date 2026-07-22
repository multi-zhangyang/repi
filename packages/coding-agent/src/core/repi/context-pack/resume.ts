/** Context-pack: buildExactResumeContextPack. */
// Landmark: buildExactResumeContextPack verifyContextPackResume compact resume reverse

import { verifyContextPackResume } from "./deps.ts";
import {
	contextPackArtifactPathFor,
	contextPackSha256,
	parseContextPackArtifact,
	resolveContextPackPathByRef,
} from "./index.ts";
import { buildMissingExactResumeContextPack } from "./resume-missing.ts";
import { applyExactResumeTransitions } from "./resume-transitions.ts";
import type { ContextPackArtifact } from "./types.ts";

export function buildExactResumeContextPack(ref: string, target?: string): ContextPackArtifact {
	const resolved = resolveContextPackPathByRef(ref);
	const source = resolved.path ? parseContextPackArtifact(resolved.path) : undefined;
	const verification = verifyContextPackResume(source, resolved.path, resolved.loadedBy, target, ref);
	if (!source) {
		return buildMissingExactResumeContextPack({ target, verification });
	}
	const timestamp = new Date().toISOString();
	const { compactResumeLedgerV2 } = applyExactResumeTransitions({
		source,
		resolvedPath: resolved.path,
		verificationBlocked: verification.blocked,
	});
	const pack: ContextPackArtifact = {
		...source,
		timestamp,
		mode: "resume",
		contextPath: contextPackArtifactPathFor({
			timestamp,
			route: source.route,
			target: target ?? source.target,
			mode: "resume",
		}),
		resumedFromContextPath: resolved.path,
		exactResumeVerification: verification,
		resumeQueueStatus: verification.blocked.length ? "blocked" : "done",
		closure: {
			status: verification.blocked.length ? "blocked" : "closed",
			closedAt: timestamp,
			reason: verification.blocked.length ? verification.blocked.join("; ") : "exact context resume verified",
			verifiedBy: "re_context exact resume",
		},
		compactResumeLedgerV2,
		sourceArtifacts: Array.from(
			new Set([resolved.path, ...(source.sourceArtifacts ?? [])].filter(Boolean) as string[]),
		).slice(0, 48),
	};
	pack.contextSha256 = contextPackSha256(pack);
	return pack;
}
