/** Technique taxonomy completeness + route→technique ids. */
import type { RoutePlan } from "../routes.ts";
import { CWE_ENTRIES, MITRE_TECHNIQUES, unresolvedTaxonomyIds } from "../taxonomy.ts";
import { ADVANCED_TECHNIQUES } from "./catalog.ts";
import { techniquesForDomain } from "./lookup.ts";
import type { TechniqueDomain } from "./types.ts";

/**
 * Self-check: every MITRE/CWE id referenced by the catalog must resolve in the
 * taxonomy. Used by tests so the catalog never drifts from taxonomy.ts.
 */
export function unresolvedCatalogTaxonomyIds(): {
	mitre: string[];
	cwe: string[];
	entries: string[];
} {
	const mitreIds: string[] = [];
	const cweIds: string[] = [];
	const badEntries: string[] = [];
	for (const entry of ADVANCED_TECHNIQUES) {
		const unresolved = unresolvedTaxonomyIds(entry.mitre ?? [], entry.cwe ?? []);
		if (unresolved.mitre.length > 0 || unresolved.cwe.length > 0) {
			badEntries.push(entry.id);
		}
		mitreIds.push(...(entry.mitre ?? []));
		cweIds.push(...(entry.cwe ?? []));
	}
	const unresolved = unresolvedTaxonomyIds(mitreIds, cweIds);
	return { mitre: unresolved.mitre, cwe: unresolved.cwe, entries: badEntries };
}

/** Re-export taxonomy sizes for completeness checks. */
export const TAXONOMY_SIZES = {
	mitre: MITRE_TECHNIQUES.length,
	cwe: CWE_ENTRIES.length,
};
const ROUTE_LABEL_TO_TECHNIQUE_DOMAIN: Record<string, TechniqueDomain> = {
	"Pwn / exploit": "pwn",
	"Web / API pentest": "web-api",
	"Web pentest scanning": "web-scan",
	"Frontend JS reverse": "js-reverse",
	"Crypto / stego": "crypto-stego",
	"Native reverse": "native-reverse",
	"Mobile / iOS": "mobile",
	"Mobile / Android": "mobile",
	"Firmware / IoT": "firmware-iot",
	"DFIR / PCAP / stego": "dfir-pcap",
	"Cloud / container": "cloud-container",
	"Identity / Windows / AD": "identity-ad",
	"Malware analysis": "malware",
	"Agent / LLM boundary": "agent-llm",
	"Memory forensics": "memory-forensics",
	"Exploit reliability": "exploit-reliability",
};

export function techniqueIdsForRoute(route: RoutePlan): string[] {
	const domain = ROUTE_LABEL_TO_TECHNIQUE_DOMAIN[route.domain];
	if (!domain) return [];
	return techniquesForDomain(domain).map((entry: any) => entry.id);
}
