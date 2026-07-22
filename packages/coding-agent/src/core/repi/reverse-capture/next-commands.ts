/** Domain-aware reverse capture next commands + proof gate lines. */
export function reverseDomainCaptureNextCommands(input: {
	routeOrBlob?: string;
	target?: string;
	includeGates?: boolean;
}): string[] {
	const blob = String(input.routeOrBlob ?? "");
	const t = (input.target ?? "").trim();
	const hasTarget = Boolean(t) && !/^</.test(t) && !/^reverse\/pentest/i.test(t);
	const withTarget = (cmd: string) => (hasTarget ? `${cmd} ${t}` : cmd);
	// Always close with domain proof exit + completion audit.
	const next: string[] = ["re_domain_proof_exit show", "re_complete audit", withTarget("re_runtime_adapter run")];
	if (/frontend|js|sourcemap|signing/i.test(blob)) {
		// JS/signing: live browser + signing run-first.
		next.push(withTarget("re_js_signing run"));
		next.push(withTarget("re_live_browser run"));
	} else if (/web \/ api|web pentest|browser|authz|web_authz/i.test(blob)) {
		next.push(withTarget("re_live_browser run"));
		next.push(withTarget("re_web_authz_state run"));
	} else if (/mobile|apk|frida|android|ios/i.test(blob)) {
		// Prefer run-first mobile capture; attach remains opt-in via REPI_MOBILE_ATTACH=1.
		next.push(withTarget("re_mobile_runtime run"));
		next.push("re_techniques show mobile-apk-signing-v1 | mobile-ssl-pin-bypass");
		if (/attach_skipped|no devices|device|ssl_pin|root|frida_host/i.test(blob)) {
			next.push(`REPI_MOBILE_ATTACH=1 ${withTarget("re_mobile_runtime run")}`);
		}
		next.push(withTarget("re_native_runtime run"));
		next.push("re_bootstrap plan adb frida aapt jadx");
	} else if (/pwn|exploit reliability|\bexploit\b|rop|crash/i.test(blob)) {
		next.push(withTarget("re_native_runtime run"));
		// Dyn crash/offset probe product-default ON; opt-out REPI_NATIVE_DYN=0.
		if (/pending_runtime_capture|dyn_probe_skipped|gdb_missing|exact=unknown/i.test(blob)) {
			next.push(`REPI_NATIVE_DYN=1 ${withTarget("re_native_runtime run")}`);
		}
		next.push(withTarget("re_exploit_lab run"));
	} else if (/malware|yara|capa|floss|ioc|c2|sample/i.test(blob) && !/pcap|dfir/i.test(blob)) {
		next.push(withTarget("re_runtime_adapter run"));
		next.push(withTarget("re_native_runtime run"));
		next.push("re_bootstrap plan yara capa floss strings file");
		next.push("re_techniques show malware-yara-capa-triage-first | malware-config-carve");
	} else if (/dfir|pcap|firmware|ioc|malware/i.test(blob)) {
		// DFIR/firmware: adapter run-first + pure-python pcap fallback + host tool bootstrap.
		next.push(withTarget("re_runtime_adapter run"));
		next.push(`re_lane plan extract${hasTarget ? ` ${t}` : ""}`);
		if (/firmware|binwalk|rootfs|squashfs|iot/i.test(blob)) {
			next.push("re_bootstrap plan binwalk unsquashfs file strings");
			next.push(withTarget("re_native_runtime run"));
		} else {
			next.push("re_bootstrap plan tshark capinfos tcpdump binwalk file");
		}
		next.push("re_techniques show dfir-tls-sni-ja3-timeline | dfir-stream-follow-object-carve | fw-rootfs-extract");
	} else if (/memory forensics|mem-image|volatility|\bmem\b|vmem|hiberfil|pagefile/i.test(blob)) {
		next.push(withTarget("re_runtime_adapter run"));
		next.push(`re_lane plan process-network${hasTarget ? ` ${t}` : ""}`);
		next.push("re_bootstrap plan volatility3 strings file");
		next.push("re_techniques show mem-image-profile | mem-process-network");
	} else if (/cloud|k8s|kubernetes|imds|identity|kerberoast|bloodhound|aws_|azure_|gcp/i.test(blob)) {
		next.push(withTarget("re_runtime_adapter run"));
		next.push(`re_lane plan privilege${hasTarget ? ` ${t}` : ""}`);
		next.push("re_bootstrap plan python3 kubectl aws");
		next.push("re_techniques show cloud-imds-ssrf-chain | cloud-k8s-sa-token-abuse | identity-kerberoast-asrep");
	} else if (/crypto|stego|cipher|z3|known-answer|modulus|nonce/i.test(blob)) {
		next.push(withTarget("re_runtime_adapter run"));
		next.push(`re_lane plan solver${hasTarget ? ` ${t}` : ""}`);
		next.push("re_bootstrap plan python3 openssl z3");
		next.push(
			"re_techniques show crypto-param-inventory | crypto-transform-replay | crypto-rsa-textbook | crypto-aes-ecb",
		);
	} else if (/agent.?security|prompt injection|tool boundary|mcp|memory poison/i.test(blob)) {
		next.push(withTarget("re_runtime_adapter run"));
		next.push(`re_lane plan injection${hasTarget ? ` ${t}` : ""}`);
		next.push("re_bootstrap plan rg python3");
		next.push("re_techniques show agent-prompt-surface | agent-tool-boundary");
	} else if (/native|binary|elf|reverse/i.test(blob)) {
		// Prefer run-first native capture; dyn probe default-on (REPI_NATIVE_DYN!=0).
		next.push(withTarget("re_native_runtime run"));
		if (/pending_runtime_capture|dyn_probe_skipped|gdb_missing|exact=unknown/i.test(blob)) {
			next.push(`REPI_NATIVE_DYN=1 ${withTarget("re_native_runtime run")}`);
		}
		next.push("re_bootstrap plan checksec gdb ROPgadget frida");
	} else {
		// Unknown reverse-heavy: cover primary capture runners.
		next.push(withTarget("re_native_runtime run"));
		next.push(withTarget("re_live_browser run"));
		next.push(withTarget("re_js_signing run"));
		next.push(withTarget("re_mobile_runtime run"));
	}
	if (input.includeGates) {
		next.push(
			"reverse_runtime_capture_gate: require proof.exit=partial_runtime_capture|runtime_capture_strong",
			"reverse_runtime_capture_gate: require bind_ready=true before claim",
			"reverse_runtime_capture_gate: blocked_until_runtime_capture_and_bind_ready",
			"reverse_runtime_capture_gate: prefer_run_over_plan_for_capture",
		);
	}
	return Array.from(new Set(next));
}
