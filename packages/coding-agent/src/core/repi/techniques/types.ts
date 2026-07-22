/**
 * Technique catalog types for REPI progressive-disclosure playbooks.
 */
export type TechniqueDomain =
	| "pwn"
	| "web-api"
	| "web-scan"
	| "js-reverse"
	| "crypto-stego"
	| "native-reverse"
	| "mobile"
	| "firmware-iot"
	| "identity-ad"
	| "cloud-container"
	| "malware"
	| "agent-llm"
	| "memory-forensics"
	| "dfir-pcap"
	| "exploit-reliability";

export interface TechniqueEntry {
	/** Stable slug, e.g. "pwn-tcache-poisoning". */
	id: string;
	/** Human-readable technique name. */
	name: string;
	/** Domain this technique belongs to. */
	domain: TechniqueDomain;
	/** MITRE ATT&CK technique id(s) where a standard mapping exists. */
	mitre?: string[];
	/** CWE id(s) where a standard class exists. */
	cwe?: string[];
	/** When to consider this technique (signals observed during mapping). */
	triggers: string;
	/** Concrete, ordered procedure to prove the technique. */
	procedure: string[];
	/** What observation proves the technique succeeded (falsifiable). */
	proofExit: string;
	/** Common failure modes / false positives to avoid. */
	pitfalls: string[];
	/** Tool names (must exist in REPI tool index) the procedure relies on. */
	tools: string[];
}
