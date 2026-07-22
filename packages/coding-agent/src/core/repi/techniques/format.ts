/** Technique catalog formatters (index + playbook). */

import { formatCweTags, formatMitreTag } from "../taxonomy.ts";
import { domainLabel, techniqueDomains, techniquesForDomain } from "./lookup.ts";
import type { TechniqueEntry } from "./types.ts";

/**
 * Compact one-line-per-technique index for system-prompt injection. Lists every
 * technique id + name + domain so the model knows what to pull via re_techniques.
 */
export function formatTechniqueIndex(): string {
	const lines: string[] = ["# REPI advanced-technique index (pull via re_techniques)", ""];
	const domains = techniqueDomains();
	for (const domain of domains) {
		lines.push(`## ${domainLabel(domain)}`);
		for (const entry of techniquesForDomain(domain)) {
			const tags: string[] = [];
			if (entry.mitre && entry.mitre.length > 0) tags.push(entry.mitre.join(","));
			if (entry.cwe && entry.cwe.length > 0) tags.push(entry.cwe.join(","));
			const tagText = tags.length > 0 ? ` [${tags.join(" | ")}]` : "";
			lines.push(`- ${entry.id}: ${entry.name}${tagText}`);
		}
		lines.push("");
	}
	lines.push(
		"调用 re_techniques(domain=<domain>) 取该域完整 playbook(触发条件/具体程序/proof-exit/坑/工具),或 re_techniques(id=<id>) 取单条。常用别名如 web-api-authz/web-authz/web-runtime 会解析到 web-api。",
	);
	return lines.join("\n");
}

function formatEntry(entry: TechniqueEntry): string {
	const lines: string[] = [];
	lines.push(`## ${entry.id} — ${entry.name}`);
	lines.push(`domain: ${entry.domain}`);
	if (entry.mitre && entry.mitre.length > 0) {
		lines.push(entry.mitre.map((id: any) => formatMitreTag(id)).join("\n"));
	}
	if (entry.cwe && entry.cwe.length > 0) {
		lines.push(`CWE: ${formatCweTags(entry.cwe)}`);
	}
	lines.push("");
	lines.push("when to use:");
	lines.push(`  ${entry.triggers}`);
	lines.push("");
	lines.push("procedure:");
	for (let i = 0; i < entry.procedure.length; i++) {
		lines.push(`  ${i + 1}. ${entry.procedure[i]}`);
	}
	lines.push("");
	lines.push("proof-exit (falsifiable):");
	lines.push(`  ${entry.proofExit}`);
	lines.push("");
	lines.push("pitfalls:");
	for (const pitfall of entry.pitfalls) {
		lines.push(`  - ${pitfall}`);
	}
	lines.push("");
	lines.push(`tools: ${entry.tools.join(", ")}`);
	return lines.join("\n");
}

/** Full playbook text for a set of techniques (the re_techniques tool output). */
export function formatTechniquePlaybook(entries: readonly TechniqueEntry[]): string {
	if (entries.length === 0) {
		return "No catalogued advanced techniques matched. Fall back to the domain runtime planner and record the gap via re_reflect.";
	}
	const header = ["# REPI advanced-technique playbook", ""];
	for (const entry of entries) {
		header.push(formatEntry(entry));
		header.push("");
	}
	return header.join("\n");
}
