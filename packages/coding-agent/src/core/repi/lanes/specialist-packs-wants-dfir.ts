/** Specialist pack DFIR/malware/cloud/identity want detectors. */
export function detectSpecialistDfirWants(input: {
	domain: string;
	laneName: string;
	context: string;
	task: string;
	targetLooksPcap: boolean;
	targetLooksFirmware: boolean;
	targetLooksMemoryImage: boolean;
}): {
	wantsPcap: boolean;
	wantsFirmware: boolean;
	wantsMemoryForensics: boolean;
	wantsCryptoStego: boolean;
	wantsAgentSecurity: boolean;
	wantsMalware: boolean;
	wantsCloudRuntime: boolean;
	wantsIdentityAd: boolean;
} {
	const { domain, laneName, context, task, targetLooksPcap, targetLooksFirmware, targetLooksMemoryImage } = input;
	void task;
	const wantsPcap =
		targetLooksPcap ||
		(/dfir|pcap|pcapng|forensic|stego|wireshark|tshark|packet|capture|流量|取证|隐写/.test(context) &&
			/map|prove|extract|expand|timeline|flow|artifact|decode|verify/.test(laneName));
	const wantsFirmware =
		((domain === "Firmware / IoT" && targetLooksFirmware) ||
			/firmware|固件|\biot\b|router|openwrt|squashfs|uboot|u-boot|uart|jtag|mips|\barm(?:el|hf|64)?\b|ubi\b|ubifs|trx\b|uimage|initramfs|rootfs/.test(
				context,
			)) &&
		/inventory|extract|filesystem|service|emulate|triage|map|config|secret|surface|prove|runtime|report|verify/.test(
			laneName,
		);
	const wantsMemoryForensics =
		targetLooksMemoryImage ||
		((domain === "Memory forensics" ||
			/memory forensics|memory dump|memdump|vmem|volatility|内存取证|内存镜像|内存转储|lsass|hiberfil|pagefile|crash dump|raw image/.test(
				context,
			)) &&
			/image|process|network|credential|artifact|timeline|carve|report|verify|map|prove/.test(laneName));
	const wantsCryptoStego =
		(domain === "Crypto / stego" ||
			/\bcrypto\b|cryptography|rsa|aes|cbc|ecb|gcm|nonce|iv\b|padding oracle|oracle|lattice|sage|z3|hashcat|john|xor|base64|base32|hex|modulus|exponent|elliptic|ecdsa|stego|隐写|密码题|格|同余|椭圆曲线|transform chain/.test(
				context,
			)) &&
		/inventory|parameter|transform|oracle|constraint|solver|known|answer|decode|stego|map|prove|runtime|report|verify/.test(
			laneName,
		);
	const wantsAgentSecurity =
		(domain === "Agent / LLM boundary" ||
			/prompt injection|system prompt|developer message|tool injection|tool-call|tool call|function call|mcp|model context protocol|agent\s*安全|llm\s*安全|rag|retrieval|memory poisoning|记忆投毒|工具滥用|越狱|jailbreak|indirect prompt|untrusted content/.test(
				context,
			)) &&
		/surface|tool|boundary|memory|injection|delegation|map|prove|runtime|report|verify|poc/.test(laneName);
	const wantsMalware =
		/malware|恶意|样本|ioc|c2|yara|sigma|beacon|implant|loader|ransom|trojan|backdoor|反调试|反沙箱|packer|upx/.test(
			context,
		) && /triage|static|config|behavior|decode|ioc|map|prove|runtime|report|verify/.test(laneName);
	const wantsCloudRuntime =
		/cloud|container|docker|k8s|kubernetes|metadata|aws|azure|gcp|iam|serviceaccount|terraform|helm|容器|云/.test(
			context,
		) && /identity|runtime|config|metadata|privilege|map|prove|verify|poc/.test(laneName);
	const wantsIdentityAd =
		/identity|windows|active directory|ad\b|kerberos|ntlm|ldap|smb|spn|sid|ticket|hash|bloodhound|certipy|nxc|crackmapexec|域控|内网|横向|凭据|提权/.test(
			context,
		) && /principal|credential|graph|pivot|proof|map|prove|verify|poc/.test(laneName);

	return {
		wantsPcap,
		wantsFirmware,
		wantsMemoryForensics,
		wantsCryptoStego,
		wantsAgentSecurity,
		wantsMalware,
		wantsCloudRuntime,
		wantsIdentityAd,
	};
}
