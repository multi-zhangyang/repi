export { auditCompletion } from "./completion-audit/audit.ts";
export type { CompletionAudit } from "./completion-audit/audit-claims.ts";
/**
 * Completion audit + report scaffold for REPI missions.
 * Implementation under ./completion-audit/*.
 */
export type { CompletionAuditDeps } from "./completion-audit/deps.ts";
export {
	buildEvidenceDigest,
	configureCompletionAudit,
	formatMission,
} from "./completion-audit/deps.ts";
export {
	formatCompletionAudit,
	formatCompletionAuditFromAudit,
	writeDomainProofExitClosureArtifact,
	writeReportScaffold,
} from "./completion-audit/format.ts";
export { auditReverseProofFromEvidence } from "./completion-audit/reverse.ts";
