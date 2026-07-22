/** MITRE/CWE taxonomy lookup/format helpers. */
import { CWE_ENTRIES, MITRE_TECHNIQUES } from "./taxonomy-data.ts";
import type { CweEntry, MitreTechnique } from "./taxonomy-types.ts";

const mitreById = new Map(MITRE_TECHNIQUES.map((row: any) => [row.id, row]));
const cweById = new Map(CWE_ENTRIES.map((row: any) => [row.id, row]));

export function mitreTechnique(id: string): MitreTechnique | undefined {
	return mitreById.get(id);
}

export function cweEntry(id: string): CweEntry | undefined {
	return cweById.get(id);
}

export function formatMitreTag(id: string): string {
	const entry = mitreTechnique(id);
	if (!entry) return `MITRE ATT&CK ${id}`;
	return `MITRE ATT&CK ${id} — ${entry.name} (${entry.tactics.join(", ")})`;
}

export function formatCweTags(ids: readonly string[]): string {
	if (ids.length === 0) return "";
	return ids
		.map((id: any) => {
			const entry = cweEntry(id);
			return entry ? `${id} — ${entry.title}` : id;
		})
		.join(" | ");
}

export function unresolvedTaxonomyIds(
	mitreIds: readonly string[],
	cweIds: readonly string[],
): { mitre: string[]; cwe: string[] } {
	return {
		mitre: mitreIds.filter((id: any) => !mitreById.has(id)),
		cwe: cweIds.filter((id: any) => !cweById.has(id)),
	};
}
