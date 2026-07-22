/** Reverse query signal extraction from evidence ledgers. */

function lastMatch(text: string, re: RegExp): string | undefined {
	const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`;
	const global = new RegExp(re.source, flags);
	const matches = [...text.matchAll(global)];
	for (let i = matches.length - 1; i >= 0; i--) {
		const value = matches[i]?.[1]?.trim();
		if (value) return value;
	}
	return undefined;
}

function pickPreferredTechnique(text: string): string | undefined {
	const lines = [...text.matchAll(/(?:^|\n)\s*-\s*query\.technique\s*:\s*(.+)$/gim)]
		.map((match) => match[1]?.trim())
		.filter((value): value is string => Boolean(value));
	if (lines.length === 0) {
		return lastMatch(text, /(?:query\.)?technique\s*[:=]\s*([A-Za-z0-9_./-]+)/i);
	}
	// Prefer the latest non-native technique when the shared ledger mixed domains.
	const nativeish = /rev-checksec|rev-rop|pwn-orw|native-angr|native-runtime|checksec/i;
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i]!;
		if (!nativeish.test(line)) return line.slice(0, 120);
	}
	return lines[lines.length - 1]!.slice(0, 120);
}

export function reverseQuerySignalsFromEvidence(text: string): string[] {
	const out: string[] = [];
	const tech = pickPreferredTechnique(text);
	const mitre =
		lastMatch(text, /(?:^|\n)\s*-\s*query\.mitre\s*:\s*(.+)$/im) ??
		lastMatch(text, /(?:query\.)?mitre\s*[:=]\s*([A-Za-z0-9_.,T-]+)/i);
	const cwe =
		lastMatch(text, /(?:^|\n)\s*-\s*query\.cwe\s*:\s*(.+)$/im) ??
		lastMatch(text, /(?:query\.)?cwe\s*[:=]\s*([A-Za-z0-9_.,-]+)/i);
	const proof =
		lastMatch(text, /(?:^|\n)\s*-\s*query\.proof_exit\s*:\s*(.+)$/im) ??
		lastMatch(text, /(?:query\.)?proof_exit\s*[:=]\s*([^\n|]+)/i) ??
		lastMatch(text, /proof\.exit\s*=\s*([^\n|\s]+)/i) ??
		lastMatch(text, /summary\.runtime_proof_exit\s*=\s*([^\n|\s]+)/i);
	const bind =
		lastMatch(text, /(?:^|\n)\s*-\s*(?:query\.|summary\.)?bind_ready\s*:\s*(true|false)/im) ??
		lastMatch(text, /(?:query\.|summary\.)?bind_ready\s*[:=]\s*(true|false)/i) ??
		lastMatch(text, /bind\.ready\s*[:=]\s*(true|false)/i) ??
		lastMatch(text, /bind_ready\s*=\s*(true|false)/i);
	if (tech) out.push(`reverse.technique=${tech.trim().slice(0, 80)}`);
	if (mitre) out.push(`reverse.mitre=${mitre.trim().slice(0, 80)}`);
	if (cwe) out.push(`reverse.cwe=${cwe.trim().slice(0, 80)}`);
	if (proof) out.push(`reverse.proof_exit=${proof.trim().slice(0, 120)}`);
	if (bind) out.push(`reverse.bind_ready=${bind.toLowerCase()}`);
	return out;
}
