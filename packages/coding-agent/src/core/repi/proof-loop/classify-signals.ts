/** Proof-loop gap adapter ids + proof signal extraction. */
export function runtimeAdapterIdsFromGapText(text: string): string[] {
	const ids = new Set<string>();
	const hay = String(text ?? "");
	// Explicit adapter ids in gap text.
	for (const match of hay.matchAll(/\b([a-z0-9][a-z0-9-]*-adapter)\b/gi)) {
		ids.add(match[1].toLowerCase());
	}
	// Domain heuristics when only narrative gaps are present.
	if (/native|pwn|elf|checksec|gdb|rop|mitigation/i.test(hay)) {
		ids.add("gdb-native-trace-adapter");
		ids.add("pwntools-local-verifier-adapter");
		ids.add("r2-native-xref-adapter");
	}
	if (/firmware|binwalk|rootfs|iot/i.test(hay)) {
		ids.add("binwalk-firmware-extract-adapter");
		ids.add("firmware-rootfs-service-map-adapter");
	}
	if (/mobile|frida|apk|ipa/i.test(hay)) ids.add("frida-mobile-hook-adapter");
	if (/pcap|tshark|dfir|traffic/i.test(hay)) ids.add("tshark-pcap-flow-adapter");
	if (/browser|cdp|xhr|websocket|web authz|bola|idor/i.test(hay)) ids.add("web-cdp-network-adapter");
	if (/ghidra|decompile|headless/i.test(hay)) ids.add("ghidra-headless-summary-adapter");
	return Array.from(ids);
}

export function proofSignalListFromGapText(text: string, mode: "missing" | "matched"): string[] {
	const hay = String(text ?? "");
	const missing: string[] = [];
	const matched: string[] = [];
	const push = (bucket: string[], signal: string) => {
		if (!bucket.includes(signal)) bucket.push(signal);
	};
	if (
		/proof_exit\s*=\s*(?:partial_runtime_capture|runtime_capture_strong)/i.test(hay) ||
		/runtime_capture_strong|partial_runtime_capture/i.test(hay)
	) {
		push(matched, "proof.exit=partial_or_strong");
	}
	if (
		/proof_exit\s*=\s*pending|pending_runtime_capture|missing-proof-exit|missing proof_exit|proof_exit_missing/i.test(
			hay,
		)
	) {
		push(missing, "proof.exit");
	}
	if (/bind_ready\s*=\s*true/i.test(hay)) push(matched, "bind_ready=true");
	if (/bind_ready\s*=\s*false|bind_ready missing|without bind_ready/i.test(hay)) push(missing, "bind_ready");
	if (/mitigation map matched|checksec|NX=|PIE=|RelRO=/i.test(hay)) push(matched, "native-mitigation-map");
	if (/mitigation map missing|no mitigation|checksec missing/i.test(hay)) push(missing, "native-mitigation-map");
	if (/parser_signal_summary|parser no-match|no parser match/i.test(hay)) push(missing, "adapter-parser-signals");
	if (/parser match|proof-capture|native-proof-capture|browser-proof-capture/i.test(hay))
		push(matched, "adapter-parser-signals");
	if (/technique(?:\s*id)?\s*=|query\.technique=/i.test(hay)) push(matched, "technique-anchor");
	if (/technique without proof|unbound technique|no technique/i.test(hay)) push(missing, "technique-anchor");
	return mode === "missing" ? missing : matched;
}
