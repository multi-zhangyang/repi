import { reverseEvidenceFactsFromSummary } from "./facts-from-summary.ts";
import { reverseTechniqueEvidenceAnchors } from "./technique-anchors-evidence.ts";

export function reverseEvidenceConfidence(base: string, structuredSummary?: string[]): string {
	const bits: string[] = [];
	if (!base.includes("reverse:structured-summary")) bits.push("reverse:structured-summary");
	const tech = reverseTechniqueEvidenceAnchors(structuredSummary);
	if (tech.some((line: any) => line.startsWith("technique.id="))) bits.push("reverse:technique-catalog");
	if (tech.some((line: any) => line.startsWith("technique.tools="))) bits.push("reverse:technique-tools");
	if (tech.some((line: any) => line.startsWith("technique.proof_exit="))) bits.push("reverse:technique-proof-exit");
	if (tech.some((line: any) => line.startsWith("technique.mitre="))) bits.push("reverse:technique-mitre");
	if (tech.some((line: any) => line.startsWith("technique.cwe="))) bits.push("reverse:technique-cwe");
	if (bits.length === 0) return base;
	return `${base} | ${bits.join(" | ")}`;
}

/** Compact ledger fact line with queryable reverse fields. */

/** Compact proof lines for reverse adapters (technique + mitre/cwe + proof_exit). */
export function reverseEvidenceProofLines(structuredSummary?: string[], anchors: string[] = []): string[] {
	const facts = reverseEvidenceFactsFromSummary(structuredSummary, anchors);
	const tech = reverseTechniqueEvidenceAnchors(structuredSummary, anchors);
	const out: string[] = [];
	// catalog technique lines are not enough for claim; surface runtime capture requirement.
	out.push("proof.capture_required=partial_runtime_capture|runtime_capture_strong");
	out.push("proof.bind_ready_required=true");
	if (facts.technique) out.push(`proof.technique=${facts.technique}`);
	if (facts.mitre) out.push(`proof.mitre=${facts.mitre}`);
	if (facts.cwe) out.push(`proof.cwe=${facts.cwe}`);
	// Runtime capture only — catalog requirements stay under technique.proof_exit.
	const runtimeExit =
		facts.proofExit && !/^(catalog_unbound|missing|pending_runtime_capture)$/i.test(facts.proofExit)
			? facts.proofExit
			: undefined;
	if (runtimeExit) out.push(`proof.exit=${runtimeExit}`);
	for (const line of tech) {
		if (/^technique\.(proof_exit|mitre|cwe|id)=/i.test(line) && !out.includes(line)) out.push(line);
	}
	// Surface catalog requirement without treating it as capture.
	for (const line of [...(structuredSummary ?? []), ...anchors]) {
		if (typeof line !== "string") continue;
		if (/^technique\.proof_exit=/i.test(line) && !out.includes(line)) out.push(line);
	}
	return out.slice(0, 16);
}

export function reverseEvidenceFactLine(kind: string, structuredSummary?: string[], extra: string[] = []): string {
	const facts = reverseEvidenceFactsFromSummary(structuredSummary);
	const bits = [
		`reverse_kind=${kind}`,
		facts.technique && `technique=${facts.technique}`,
		facts.mitre && `mitre=${facts.mitre}`,
		facts.cwe && `cwe=${facts.cwe}`,
		facts.proofExit && `proof_exit=${facts.proofExit}`,
		facts.url && `url=${facts.url}`,
		facts.route && `route=${facts.route}`,
		facts.httpStatus && `http_status=${facts.httpStatus}`,
		facts.package && `package=${facts.package}`,
		facts.arch && `arch=${facts.arch}`,
		facts.binary && `binary=${facts.binary}`,
		facts.blocked && `blocked=${facts.blocked}`,
		...extra.filter(Boolean).slice(0, 6),
	].filter(Boolean);
	const techBits = reverseTechniqueEvidenceAnchors(structuredSummary).filter((b: any) => b.startsWith("technique."));
	const toolBit = techBits.find((b: any) => b.startsWith("technique.tools="));
	const summaryBits = (structuredSummary ?? []).slice(0, 8);
	return [...bits, ...techBits.slice(0, 8), ...(toolBit ? [] : []), ...summaryBits].join(" | ");
}
