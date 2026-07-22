/** Technique catalog lookup helpers. */

import { ADVANCED_TECHNIQUES } from "./catalog.ts";
import type { TechniqueDomain, TechniqueEntry } from "./types.ts";

const byDomainMap = new Map<TechniqueDomain, TechniqueEntry[]>();
for (const entry of ADVANCED_TECHNIQUES) {
	const list = byDomainMap.get(entry.domain) ?? [];
	list.push(entry);
	byDomainMap.set(entry.domain, list);
}

/** All techniques for a domain, or an empty array if none catalogued. */
export function techniquesForDomain(domain: TechniqueDomain): TechniqueEntry[] {
	return byDomainMap.get(domain) ?? [];
}

/** Resolve a technique by its stable id. */
export function techniqueById(id: string): TechniqueEntry | undefined {
	return ADVANCED_TECHNIQUES.find((entry: any) => entry.id === id);
}

/** Domains that have at least one catalogued technique. */
export function techniqueDomains(): TechniqueDomain[] {
	return [...byDomainMap.keys()];
}

const DOMAIN_ALIASES: Record<string, TechniqueDomain> = {
	"web-api-authz": "web-api",
	"web-authz": "web-api",
	"api-authz": "web-api",
	"web-runtime": "web-api",
	webauthz: "web-api",
	"native-reverse-pwn": "native-reverse",
	"native-runtime": "native-reverse",
	"pwn-chain": "pwn",
	"mobile-reverse": "mobile",
	"mobile-android": "mobile",
	"mobile-ios": "mobile",
	firmware: "firmware-iot",
	"agent-boundary": "agent-llm",
	"agentsec-boundary": "agent-llm",
	"pcap-dfir-carve": "dfir-pcap",
	"pcap-dfir": "dfir-pcap",
	dfir: "dfir-pcap",
	pcap: "dfir-pcap",
	forensic: "dfir-pcap",
	"cloud-identity-pivot": "cloud-container",
	cloud: "cloud-container",
	container: "cloud-container",
	iot: "firmware-iot",
	js: "js-reverse",
	"frontend-js": "js-reverse",
	"js-signing": "js-reverse",
	"js-reverse": "js-reverse",
	crypto: "crypto-stego",
	stego: "crypto-stego",
	memory: "memory-forensics",
	"memory-forensics": "memory-forensics",
	"identity-windows": "identity-ad",
	"malware-analysis": "malware",
};

/** Resolve user/model-facing route aliases (skill hints, older capsule names)
 *  to catalogued technique domains. */
export function resolveTechniqueDomain(domain: string): TechniqueDomain | undefined {
	const normalized = domain.trim().toLowerCase();
	if ((techniqueDomains() as string[]).includes(normalized)) return normalized as TechniqueDomain;
	return DOMAIN_ALIASES[normalized];
}

const DOMAIN_LABELS: Record<TechniqueDomain, string> = {
	pwn: "Pwn / exploit",
	"web-api": "Web / API",
	"web-scan": "Web scanning",
	"js-reverse": "Frontend JS reverse",
	"crypto-stego": "Crypto / stego",
	"native-reverse": "Native reverse",
	mobile: "Mobile (Android/iOS)",
	"firmware-iot": "Firmware / IoT",
	"identity-ad": "Identity / Windows / AD",
	"cloud-container": "Cloud / container",
	malware: "Malware analysis",
	"agent-llm": "Agent / LLM boundary",
	"memory-forensics": "Memory forensics",
	"dfir-pcap": "DFIR / PCAP",
	"exploit-reliability": "Exploit reliability",
};

/** Human label for a domain. */
export function domainLabel(domain: TechniqueDomain): string {
	return DOMAIN_LABELS[domain];
}
