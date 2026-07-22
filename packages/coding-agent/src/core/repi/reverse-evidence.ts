/**
 * Shared reverse evidence formatting for structuredSummary fields.
 * Implementation under ./reverse-evidence/*.
 */

export {
	applyReverseStructuredSummary,
	reverseEvidenceConfidence,
	reverseEvidenceFactLine,
	reverseEvidenceFactsFromSummary,
	reverseEvidenceFactsMarkdown,
	reverseEvidenceProofLines,
	reverseEvidenceSummaryText,
	reverseStructuredSummaryLines,
	reverseStructuredSummaryMarkdown,
} from "./reverse-evidence/facts.ts";
export {
	reverseEvidenceEnrichFromTechniqueId,
	reverseEvidenceLedgerPayload,
	reverseEvidenceQueryFields,
	reverseProofExitMissingBlockers,
	reverseRuntimeTechniqueAnchor,
	reverseTechniqueEvidenceAnchors,
	reverseTechniqueProofChecklist,
} from "./reverse-evidence/technique.ts";
export type { ReverseEvidenceFacts } from "./reverse-evidence/types.ts";
export { REVERSE_EVIDENCE_QUERY_KEYS } from "./reverse-evidence/types.ts";
