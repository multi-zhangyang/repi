/** Reverse evidence ledger payload helpers. */
import { reverseEvidenceFactsFromSummary } from "./facts-from-summary.ts";
import { reverseEvidenceProofLines } from "./facts-proof.ts";
import { reverseEvidenceQueryFields } from "./technique-anchors-evidence.ts";

/** Stable query key list for reverse evidence consumers / ledgers. */
export function reverseEvidenceLedgerPayload(
	structuredSummary?: string[],
	anchors: string[] = [],
): {
	query: Record<string, string>;
	meta: string[];
	factExtra: string[];
} {
	const facts = reverseEvidenceFactsFromSummary(structuredSummary, anchors);
	const query = reverseEvidenceQueryFields(facts);
	// Prefer runtime capture proof.exit over catalog-only summary.proof_exit when both exist.
	for (const line of [...(structuredSummary ?? []), ...anchors]) {
		if (typeof line !== "string") continue;
		const pe = /^(?:proof\.exit|query\.proof_exit|summary\.runtime_proof_exit)=(.+)$/i.exec(line);
		if (pe) query.proof_exit = pe[1].trim();
		const tech = /^(?:query\.|summary\.|technique\.)?technique=(.+)$/i.exec(line);
		if (tech && !query.technique) query.technique = tech[1].trim();
		const sig = /^(?:query\.|summary\.)capture_signals=(.+)$/i.exec(line);
		if (sig) query.capture_signals = sig[1].trim();
	}
	if (!query.proof_exit && facts.proofExit) query.proof_exit = facts.proofExit;
	const proofMeta = reverseEvidenceProofLines(structuredSummary, anchors);
	const factExtra = [...Object.entries(query).map(([k, v]) => `${k}=${v}`), ...proofMeta];
	const meta = Array.from(
		new Set([
			...Object.entries(query).map(([k, v]) => `${k}=${v}`),
			...proofMeta,
			...(structuredSummary ?? [])
				.filter((l: any) => /proof|technique|capture|mitigation|blocked/i.test(l))
				.slice(0, 20),
		]),
	);
	return { query, meta, factExtra };
}
