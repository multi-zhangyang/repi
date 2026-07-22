/** Completion audit core (includes reverse proof gates). */
import { auditCompletionBase } from "./audit-base.ts";
import { applyCompletionAuditClaimGates, type CompletionAudit } from "./audit-claims.ts";
import { auditReverseProofFromEvidence } from "./reverse.ts";

export function auditCompletion(): CompletionAudit {
	void auditReverseProofFromEvidence;
	const base = auditCompletionBase() as any;
	if (base?.ready === false) return base as CompletionAudit;
	if (base?.earlyReturn) return base.earlyReturn as CompletionAudit;
	return applyCompletionAuditClaimGates({
		mission: base.mission,
		blockers: base.blockers,
		warnings: base.warnings,
		reverseSignals: base.reverseSignals,
		hasProofExit: base.hasProofExit,
	});
}
