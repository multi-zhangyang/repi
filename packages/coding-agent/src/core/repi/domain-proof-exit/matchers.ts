/** Domain proof-exit matchers / expected evidence / route mapping. */
export { proofExitRegexes } from "./matchers-regexes.ts";
// Landmark: proof.exit= / bind_ready=true / native-proof-capture regexes (body in matchers-regexes.ts)

export function toolchainDomainIdForRoute(routeDomain?: string): string | undefined {
	if (!routeDomain) return undefined;
	if (/Web \/ API/i.test(routeDomain)) return "web-api";
	if (/Web pentest scanning/i.test(routeDomain)) return "web-scan";
	if (/Frontend JS/i.test(routeDomain)) return "frontend-js";
	if (/Pwn \/ exploit/i.test(routeDomain)) return "pwn";
	if (/Native reverse/i.test(routeDomain)) return "rev-native";
	if (/Mobile \/ Android/i.test(routeDomain)) return "mobile";
	if (/Mobile \/ iOS/i.test(routeDomain)) return "mobile-ios";
	if (/DFIR|PCAP/i.test(routeDomain)) return "pcap-dfir";
	if (/Memory forensics/i.test(routeDomain)) return "memory-forensics";
	if (/Firmware \/ IoT/i.test(routeDomain)) return "firmware-iot";
	if (/Crypto \/ stego/i.test(routeDomain)) return "crypto";
	if (/Cloud|Identity \/ Windows \/ AD/i.test(routeDomain)) return "cloud-identity";
	if (/Exploit reliability/i.test(routeDomain)) return "exploit-reliability";
	if (/Malware analysis/i.test(routeDomain)) return "malware-analysis";
	if (/Agent \/ LLM security/i.test(routeDomain)) return "agent-security";
	if (/CTF|sandbox/i.test(routeDomain)) return "rev-native";
	return undefined;
}

export function proofExitExpectedEvidence(proofExit: string): string[] {
	const normalized = proofExit.toLowerCase();
	const rows: string[] = [];
	const add = (...items: string[]) => rows.push(...items);
	if (/offset|symbol|import|manifest|flow|filesystem|token|parameter|multi-run|prompt/.test(normalized))
		add("path/hash-bound artifact", "tool stdout/stderr or parsed JSON row");
	if (/leak|credential|token|config|oracle|secret/.test(normalized))
		add("source line, request, trace, or carved object that exposes the value class without relying on a guess");
	if (
		/runtime|hook|trace|follow-stream|conversation|state|ownership|rollback|verifier|replay|known-answer|solver|patch|graph|delegation/.test(
			normalized,
		)
	)
		add("runtime/replay/verifier command with exit/status/hash and artifact path");
	if (/controllable|object ownership|privilege edge|state rollback|signed replay|first divergence/.test(normalized))
		add("before/after or principal A/B divergence evidence");
	if (rows.length === 0) add("concrete command output", "artifact path", "verification command");
	return Array.from(new Set(rows));
}
