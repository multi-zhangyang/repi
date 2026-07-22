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

function pickPreferredProofExit(text: string): string | undefined {
	// Collect runtime proof exits with positions; prefer latest partial|strong from browser/runtime tags.
	const hits: Array<{ value: string; index: number; weight: number }> = [];
	const patterns: Array<{ re: RegExp; weight: number }> = [
		{ re: /\[browser-proof-capture\][^\n]*proof\.exit=([A-Za-z0-9_]+)/gi, weight: 5 },
		{ re: /summary\.runtime_proof_exit\s*=\s*([A-Za-z0-9_]+)/gi, weight: 4 },
		{ re: /(?:^|\n)\s*-\s*proof\.exit\s*=\s*([A-Za-z0-9_]+)/gim, weight: 4 },
		{ re: /(?:^|\n)\s*-\s*query\.proof_exit\s*:\s*([A-Za-z0-9_|.-]+)/gim, weight: 3 },
		{ re: /(?:query\.)?proof_exit\s*[:=]\s*([A-Za-z0-9_|.-]+)/gi, weight: 2 },
		{ re: /proof\.exit\s*=\s*([A-Za-z0-9_]+)/gi, weight: 1 },
	];
	for (const { re, weight } of patterns) {
		for (const match of text.matchAll(re)) {
			const value = match[1]?.trim();
			if (!value) continue;
			// Skip catalog placeholders / unbound markers.
			if (/catalog|unbound|pending_runtime_capture|none/i.test(value) && !/partial|strong/i.test(value)) continue;
			hits.push({ value, index: match.index ?? 0, weight });
		}
	}
	if (hits.length === 0) return undefined;
	// Prefer higher weight then later index (more recent in ledger text).
	hits.sort((a, b) => a.weight - b.weight || a.index - b.index);
	let chosen = hits[hits.length - 1]!.value;
	// Challenge-only surfaces should not report strong when honesty labels present nearby.
	const challengeOnly =
		/summary\.challenge_interstitial=true|summary\.proof_honesty=challenge_surface_not_business_depth|note=challenge_surface_only/i.test(
			text,
		) && !/summary\.organic_api=true|\[browser-organic-api\]|summary\.capture\.organic_api=1/i.test(text);
	if (challengeOnly && /runtime_capture_strong/i.test(chosen)) {
		chosen = "partial_runtime_capture";
	}
	// Normalize multi-value pollution.
	const runtime = /partial_runtime_capture|runtime_capture_strong/i.exec(chosen);
	return (runtime?.[0] ?? chosen).slice(0, 120);
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
	const proof = pickPreferredProofExit(text);
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
