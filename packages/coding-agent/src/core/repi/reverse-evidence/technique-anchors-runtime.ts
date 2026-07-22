/** Reverse runtime technique anchors. */
/** Reverse technique anchors, enrich, ledger payload. */
import { techniqueById } from "../techniques.ts";

export function reverseRuntimeTechniqueAnchor(ids: string[]): string {
	const cleaned = Array.from(
		new Set(
			ids
				.map((id: any) => id.trim())
				.filter(Boolean)
				.filter((id: any) => Boolean(techniqueById(id))),
		),
	).slice(0, 8);
	if (cleaned.length === 0) return "";
	return `[runtime-technique] ${cleaned.join(" | ")}`;
}

export function reverseEvidenceEnrichFromTechniqueId(
	techRaw?: string,
	lookup?: (id: string) =>
		| {
				id?: string;
				name?: string;
				domain?: string;
				tools?: string[];
				proofExit?: string;
				mitre?: string[];
				cwe?: string[];
		  }
		| undefined,
): string[] {
	if (!techRaw) return [];
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
	const out: string[] = [];
	const tokens = techRaw
		.split(/[|,;\s]+/)
		.map((t: any) => t.trim())
		.filter(Boolean)
		.slice(0, 6);
	// also try full raw as id
	const candidates = Array.from(new Set([techRaw.trim(), ...tokens])).slice(0, 8);
	for (const token of candidates) {
		const entry = resolve(token) || resolve(token.toLowerCase());
		if (!entry) continue;
		if (entry.id) out.push(`summary.technique=${entry.id}`);
		if (entry.id) out.push(`technique.id=${entry.id}`);
		if (entry.name) out.push(`technique.name=${entry.name}`);
		if (entry.domain) out.push(`technique.domain=${entry.domain}`);
		for (const m of entry.mitre ?? []) {
			if (m) out.push(`technique.mitre=${m}`);
			if (m) out.push(`summary.mitre=${m}`);
		}
		for (const c of entry.cwe ?? []) {
			if (c) out.push(`technique.cwe=${c}`);
			if (c) out.push(`summary.cwe=${c}`);
		}
		if (entry.proofExit) {
			out.push(`technique.proof_exit=${entry.proofExit}`);
			out.push(`summary.proof_exit=${entry.proofExit}`);
		}
		break;
	}
	return Array.from(new Set(out)).slice(0, 24);
}
