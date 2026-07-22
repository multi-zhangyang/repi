/** Reverse I/O structured summary + runtime evidence append. */
/**
 * Reverse I/O shared deps and evidence write helpers.
 */
import {
	reverseEvidenceFactsFromSummary,
	reverseEvidenceProofLines,
	reverseEvidenceQueryFields,
} from "../reverse-evidence.ts";
export function reverseEvidenceLedgerFields(structuredSummary?: string[]): {
	factExtra: string[];
	query: Record<string, string>;
	meta: string[];
} {
	const facts = reverseEvidenceFactsFromSummary(structuredSummary);
	const query = reverseEvidenceQueryFields(facts);
	const proof = reverseEvidenceProofLines(structuredSummary);
	const factExtra = [...Object.entries(query).map(([k, v]) => `${k}=${v}`), ...proof];
	const meta = Array.from(new Set([...factExtra, ...proof])).slice(0, 24);
	return { factExtra, query, meta };
}
/** Merge reverse structured summary/query proof fields onto artifact anchor bags. */
export function applyReverseStructuredSummary(artifact: any, key: string): void {
	const bag = Array.isArray(artifact?.[key]) ? artifact[key] : [];
	const proof = bag.filter(
		(line: any) =>
			typeof line === "string" &&
			(/^query\./i.test(line) || /^summary\./i.test(line) || /proof_exit/i.test(line) || /technique/i.test(line)),
	);
	if (!artifact.meta || typeof artifact.meta !== "object") artifact.meta = {};
	if (proof.length) {
		artifact.meta.reverse_structured_summary = proof.slice(0, 40);
		const tech = proof.find((l: string) => /^query\.technique=/i.test(l) || /^summary\.technique=/i.test(l));
		if (tech) artifact.meta.technique = String(tech).split("=").slice(1).join("=");
		const pe = proof.find((l: string) => /proof_exit=/i.test(l));
		if (pe) artifact.meta.proof_exit = String(pe).split("=").slice(1).join("=");
	}
	artifact.meta.reverse_proof_gate = "require_proof_exit_before_claim";
}
/** Product reverse runner ledger write: anchors/query/meta + proof_exit gate. */
export { appendReverseRuntimeEvidence } from "./shared-evidence-append.ts";
