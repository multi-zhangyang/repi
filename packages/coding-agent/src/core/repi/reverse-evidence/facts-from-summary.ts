/** Reverse evidence facts from structured summary. */
import { KEY_MAP, type ReverseEvidenceFacts } from "./types.ts";

export function reverseStructuredSummaryLines(structuredSummary?: string[], anchors: string[] = []): string[] {
	const fromSummary = (structuredSummary ?? []).filter(Boolean);
	if (fromSummary.length > 0) return fromSummary.slice(0, 40);
	return anchors
		.filter((line: any) => line.startsWith("summary.") || line.startsWith("[runtime-technique]"))
		.slice(0, 40);
}

export function reverseEvidenceFactsFromSummary(
	structuredSummary?: string[],
	anchors: string[] = [],
): ReverseEvidenceFacts {
	const lines = reverseStructuredSummaryLines(structuredSummary, anchors);
	const facts: ReverseEvidenceFacts = { extra: [], lines };
	const claimed = new Set<string>();
	for (const line of lines) {
		let matched = false;
		// also accept [runtime-technique] foo
		const techAnchor = /^\[runtime-technique\]\s*(.+)$/i.exec(line);
		if (techAnchor && !facts.technique) {
			facts.technique = techAnchor[1].trim();
			matched = true;
		}
		for (const [key, re] of KEY_MAP) {
			const m = re.exec(line);
			if (!m) continue;
			if (key === "extra") continue;
			if (!(facts as any)[key]) (facts as any)[key] = m[1].trim();
			claimed.add(line);
			matched = true;
			break;
		}
		if (!matched) facts.extra.push(line);
	}
	// de-dup extra against claimed
	facts.extra = facts.extra.filter((line: any) => !claimed.has(line)).slice(0, 24);
	return facts;
}

export function reverseEvidenceFactsMarkdown(facts: ReverseEvidenceFacts): string[] {
	const rows: string[] = [];
	const push = (label: string, value?: string) => {
		if (value) rows.push(`- ${label}: ${value}`);
	};
	push("technique", facts.technique);
	push("mitre", facts.mitre);
	push("cwe", facts.cwe);
	push("proof_exit", facts.proofExit);
	push("url", facts.url);
	push("route", facts.route);
	push("http_status", facts.httpStatus);
	push("package", facts.package);
	push("arch", facts.arch);
	push("binary", facts.binary);
	push("blocked", facts.blocked);
	push("confidence", facts.confidence);
	for (const line of facts.extra.slice(0, 16)) rows.push(`- ${line}`);
	for (const line of facts.lines.slice(0, 8)) {
		if (!rows.some((r: any) => r.includes(line))) rows.push(`- ${line}`);
	}
	if (rows.length === 0) return ["- summary: (none — run mode with tool output to populate)"];
	return rows.slice(0, 40);
}
