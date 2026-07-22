/** Domain-specific proof-exit next commands. */

export function addDomainProofExitDomainCommands(commands: Set<string>, domainId: string, suffix: string): void {
	if (domainId === "web-api") {
		commands.add(`re_live_browser run${suffix}`);
		commands.add(`re_web_authz_state run${suffix}`);
	}
	if (domainId === "web-scan") {
		commands.add(`re_lane plan scope${suffix}`);
		commands.add(`re_lane run scope${suffix}`);
		commands.add(`re_lane plan verify${suffix}`);
	}
	if (domainId === "frontend-js") {
		commands.add(`re_js_signing run${suffix}`);
		commands.add(`re_live_browser run${suffix}`);
		commands.add("re_techniques show js-wasm-sidechannel | js-sourcemap-secret-harvest");
		commands.add(`re_domain_proof_exit show`);
	}
	if (domainId === "pwn" || domainId === "rev-native") {
		commands.add(`re_native_runtime run${suffix}`);
		commands.add(`re_exploit_lab run${suffix} 3`);
		commands.add(
			"re_techniques show rev-checksec-fingerprint-first | rev-rop-chain-ret2csu | pwn-orw-seccomp-bypass | native-angr-symbolic-branch",
		);
	}
	if (domainId === "mobile") {
		commands.add(`re_mobile_runtime run${suffix}`);
		commands.add(
			"re_techniques show mobile-apk-triage-frida-bridge | mobile-ssl-pinning-bypass | mobile-root-bypass",
		);
	}
	if (domainId === "mobile-ios") {
		commands.add(`re_lane plan ipa-inventory${suffix}`);
		commands.add(`re_mobile_runtime run${suffix}`);
	}
	if (domainId === "exploit-reliability") {
		commands.add(`re_exploit_lab run${suffix} 5`);
		commands.add("re_techniques show reliability-replay-matrix | pwn-orw-seccomp-bypass");
	}
	if (domainId === "pcap-dfir") {
		commands.add(`re_runtime_adapter run${suffix}`);
		commands.add(`re_lane plan extract${suffix}`);
		commands.add("re_techniques show dfir-tls-sni-ja3-timeline | dfir-stream-follow-object-carve");
		commands.add("re_bootstrap plan tshark capinfos tcpdump file");
	}
	if (domainId === "memory-forensics") {
		commands.add(`re_runtime_adapter run${suffix}`);
		commands.add(`re_lane plan process-network${suffix}`);
		commands.add("re_techniques show mem-image-profile | mem-process-network");
		commands.add("re_bootstrap plan volatility3 strings file");
	}
	if (domainId === "firmware-iot") {
		commands.add(`re_runtime_adapter run${suffix}`);
		commands.add(`re_lane plan extract${suffix}`);
		commands.add("re_techniques show fw-busybox-cred-dump | fw-rootfs-extract");
		commands.add("re_bootstrap plan binwalk unsquashfs file strings");
	}
	if (domainId === "crypto") {
		commands.add(`re_runtime_adapter run${suffix}`);
		commands.add(`re_lane plan solver${suffix}`);
		commands.add("re_techniques show crypto-param-inventory | crypto-transform-replay");
		commands.add("re_bootstrap plan python3 openssl z3");
	}
	if (domainId === "cloud-identity") {
		commands.add(`re_runtime_adapter run${suffix}`);
		commands.add(`re_lane plan privilege${suffix}`);
		commands.add("re_techniques show cloud-imds-ssrf-chain | cloud-k8s-sa-token-abuse | identity-kerberoast-asrep");
		commands.add("re_bootstrap plan python3 kubectl aws");
	}
	if (domainId === "malware-analysis") {
		commands.add(`re_runtime_adapter run${suffix}`);
		commands.add(`re_native_runtime run${suffix}`);
		commands.add(`re_lane plan behavior${suffix}`);
		commands.add("re_techniques show malware-config-carve | malware-yara-capa-triage-first");
		commands.add("re_bootstrap plan yara capa floss strings file");
	}
	if (domainId === "agent-security") {
		commands.add(`re_runtime_adapter run${suffix}`);
		commands.add(`re_lane plan injection${suffix}`);
		commands.add("re_techniques show agent-prompt-surface | agent-tool-boundary");
		commands.add("re_bootstrap plan rg python3");
	}
}
