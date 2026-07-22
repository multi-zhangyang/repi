/** Apply reverse structured summary onto artifacts. */
import {
	reverseEvidenceFactsFromSummary,
	reverseEvidenceFactsMarkdown,
	reverseStructuredSummaryLines,
} from "./facts-from-summary.ts";
import { reverseTechniqueEvidenceAnchors } from "./technique-anchors-evidence.ts";
import { reverseEvidenceEnrichFromTechniqueId } from "./technique-anchors-runtime.ts";

export function applyReverseStructuredSummary<
	T extends { structuredSummary?: string[]; runtimeAnchors?: string[]; stabilityAnchors?: string[] },
>(artifact: T, anchorsField: "runtimeAnchors" | "stabilityAnchors" = "runtimeAnchors"): T {
	const anchors = (artifact as any)[anchorsField] ?? [];
	artifact.structuredSummary = reverseStructuredSummaryLines(artifact.structuredSummary, anchors);
	const techForEnrich =
		artifact.structuredSummary
			.find((line: any) => /^summary\.technique=/i.test(line))
			?.replace(/^summary\.technique=/i, "") ||
		anchors.map((a: any) => /^\[runtime-technique\]\s*(.+)$/i.exec(a)?.[1]?.trim()).find(Boolean);
	for (const extra of reverseEvidenceEnrichFromTechniqueId(techForEnrich)) {
		if (!artifact.structuredSummary.includes(extra)) artifact.structuredSummary.push(extra);
	}
	artifact.structuredSummary = artifact.structuredSummary.slice(0, 40);
	const techAnchors = reverseTechniqueEvidenceAnchors(artifact.structuredSummary, anchors);
	if (techAnchors.length) {
		const merged = [...anchors, ...techAnchors.filter((line: any) => !anchors.includes(line))];
		(artifact as any)[anchorsField] = merged.slice(0, 80);
		// keep technique.* also queryable in structuredSummary
		const summary = artifact.structuredSummary ?? [];
		for (const line of techAnchors) {
			if (!summary.includes(line) && line.startsWith("technique.")) summary.push(line);
		}
		artifact.structuredSummary = summary.slice(0, 40);
	}
	return artifact;
}

export function reverseStructuredSummaryMarkdown(structuredSummary?: string[], anchors: string[] = []): string[] {
	const facts = reverseEvidenceFactsFromSummary(structuredSummary, anchors);
	return reverseEvidenceFactsMarkdown(facts);
}

export function reverseEvidenceSummaryText(structuredSummary?: string[], limit = 12): string {
	const facts = reverseEvidenceFactsFromSummary(structuredSummary);
	const techBits = reverseTechniqueEvidenceAnchors(structuredSummary);
	const proofExit = techBits
		.find((line: any) => line.startsWith("technique.proof_exit="))
		?.slice("technique.proof_exit=".length);
	const mitre = techBits.find((line: any) => line.startsWith("technique.mitre="))?.slice("technique.mitre=".length);
	const cwe = techBits.find((line: any) => line.startsWith("technique.cwe="))?.slice("technique.cwe=".length);
	const primary = [
		facts.technique && `technique=${facts.technique}`,
		proofExit && `proof_exit=${proofExit}`,
		mitre && `mitre=${mitre}`,
		cwe && `cwe=${cwe}`,
		facts.url && `url=${facts.url}`,
		facts.route && `route=${facts.route}`,
		facts.httpStatus && `http_status=${facts.httpStatus}`,
		facts.package && `package=${facts.package}`,
		facts.arch && `arch=${facts.arch}`,
		facts.binary && `binary=${facts.binary}`,
		facts.blocked && `blocked=${facts.blocked}`,
	].filter(Boolean) as string[];
	const rest = (structuredSummary ?? []).filter(
		(line: any) => !primary.some((p: any) => line.includes(p.split("=")[1] ?? "___")),
	);
	return [...primary, ...rest].slice(0, limit).join("; ");
}
