/** Operation step: re_techniques show/index/playbook. */
import {
	type ADVANCED_TECHNIQUES,
	formatTechniqueIndex,
	formatTechniquePlaybook,
	resolveTechniqueDomain,
	techniqueById,
	techniquesForDomain,
} from "./techniques.ts";

export function buildTechniquesOperationOutput(command: string, missionDomain?: string): string {
	const raw = command.replace(/^re[-_]techniques\b/i, "").trim();
	const id = /(?:^|\s)id[=\s]+([A-Za-z0-9_./-]+)/i.exec(raw)?.[1];
	const domainArg = /(?:^|\s)domain[=\s]+([A-Za-z0-9_./-]+)/i.exec(raw)?.[1];
	const intent = /(?:^|\s)intent[=\s]+(.+)$/i.exec(raw)?.[1]?.trim();
	const wantsIndex = /\bindex\b/i.test(raw) && !id && !domainArg;
	if (wantsIndex || (!raw && !missionDomain)) return formatTechniqueIndex();
	const entries: (typeof ADVANCED_TECHNIQUES)[number][] = [];
	if (id) {
		const entry = techniqueById(id);
		if (entry) entries.push(entry);
	} else {
		const token = domainArg || missionDomain || raw.split(/\s+/)[0] || "";
		const domain = resolveTechniqueDomain(token);
		const domainEntries = domain ? techniquesForDomain(domain) : [];
		if (intent) {
			const needle = intent.toLowerCase();
			const filtered = domainEntries.filter(
				(entry) =>
					entry.name.toLowerCase().includes(needle) ||
					entry.triggers.toLowerCase().includes(needle) ||
					entry.procedure.some((step) => step.toLowerCase().includes(needle)),
			);
			entries.push(...(filtered.length > 0 ? filtered : domainEntries));
		} else if (domainEntries.length) {
			entries.push(...domainEntries);
		}
	}
	if (entries.length === 0) return formatTechniqueIndex();
	return formatTechniquePlaybook(entries);
}
