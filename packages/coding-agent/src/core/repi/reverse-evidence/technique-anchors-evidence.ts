/** Reverse technique evidence anchors/query/ledger payload. */
/** Reverse technique anchors, enrich, ledger payload. */
import { techniqueById } from "../techniques.ts";
import { reverseEvidenceFactsFromSummary } from "./facts-from-summary.ts";
import type { ReverseEvidenceFacts } from "./types.ts";

export function reverseTechniqueEvidenceAnchors(
	structuredSummary?: string[],
	anchors: string[] = [],
	lookup?: (id: string) => any,
): string[] {
	const facts = reverseEvidenceFactsFromSummary(structuredSummary, anchors);
	const out: string[] = [];
	const techRaw =
		facts.technique ||
		anchors.map((a: any) => /^\[runtime-technique\]\s*(.+)$/i.exec(a)?.[1]?.trim()).find(Boolean) ||
		structuredSummary?.map((l: any) => /^summary\.technique=(.+)$/i.exec(l)?.[1]?.trim()).find(Boolean);
	if (!techRaw) return out;
	const resolve =
		lookup ??
		((id: string) => {
			const entry = techniqueById(id);
			if (!entry) return undefined;
			return {
				id: entry.id,
				name: entry.name,
				domain: entry.domain,
				tools: entry.tools,
				proofExit: entry.proofExit,
				mitre: entry.mitre,
				cwe: entry.cwe,
			};
		});
	const ids = techRaw
		.split(/[,;|]/)
		.map((s: any) => s.trim())
		.filter(Boolean)
		.slice(0, 6);
	for (const raw of ids) {
		const id = raw.split(/[:\s]/)[0]?.trim();
		if (!id) continue;
		out.push(`technique.id=${id}`);
		const meta = resolve(id);
		if (meta?.name) out.push(`technique.name=${meta.name}`);
		if (meta?.domain) out.push(`technique.domain=${meta.domain}`);
		if ((meta as any)?.phase) out.push(`technique.phase=${(meta as any).phase}`);
		if (meta?.tools?.length) out.push(`technique.tools=${meta.tools.slice(0, 6).join(",")}`);
		if (meta?.proofExit) out.push(`technique.proof_exit=${meta.proofExit.slice(0, 160)}`);
		if (meta?.mitre?.length) out.push(`technique.mitre=${meta.mitre.slice(0, 6).join(",")}`);
		if (meta?.cwe?.length) out.push(`technique.cwe=${meta.cwe.slice(0, 6).join(",")}`);
		out.push("technique.evidence=structured-summary");
	}
	return out.slice(0, 24);
}

/** Queryable ledger fields derived from structured reverse evidence (beyond free-form fact strings). */

export function reverseEvidenceQueryFields(facts: ReverseEvidenceFacts): Record<string, string> {
	const out: Record<string, string> = {};
	if (facts.technique) out.technique = facts.technique;
	if (facts.mitre) out.mitre = facts.mitre;
	if (facts.cwe) out.cwe = facts.cwe;
	if (facts.proofExit) out.proof_exit = facts.proofExit;
	if (facts.url) out.url = facts.url;
	if (facts.route) out.route = facts.route;
	if (facts.httpStatus) out.http_status = facts.httpStatus;
	if (facts.package) out.package = facts.package;
	if (facts.arch) out.arch = facts.arch;
	if (facts.binary) out.binary = facts.binary;
	if (facts.blocked) out.blocked = facts.blocked;
	if (facts.confidence) out.confidence = facts.confidence;
	return out;
}
