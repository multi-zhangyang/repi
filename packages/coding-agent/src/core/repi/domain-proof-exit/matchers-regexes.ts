/** Domain proof-exit regex matchers for evidence classification. */
import { escapeRegExp } from "../target.ts";

export function proofExitRegexes(proofExit: string): RegExp[] {
	const text = proofExit.toLowerCase();
	const regexes: RegExp[] = [];
	const add = (...items: RegExp[]) => regexes.push(...items);
	if (/principal matrix/.test(text))
		add(/\[auth-matrix\]|principal matrix|principal_[ab]|COOKIE_A|AUTH_A|auth_matrix/i);
	if (/object ownership/.test(text))
		add(/\[authz-ownership\]|object ownership|owner[_ -]?(principal|hash)|potential_bola|IDOR|BOLA/i);
	if (/state rollback/.test(text))
		add(/\[authz-rollback\]|state rollback|restored=(?:true|false)|rollback_hash|before=.*after=/i);
	if (/signed replay divergence/.test(text))
		add(
			/signed replay divergence|\[js-replay-harness\]|\[replay-eval\]|signature_key|replay_match|first-divergence/i,
		);
	if (/scope baseline/.test(text)) add(/\[web-scan-scope\]|\[web-scan-header\]|\[web-scan-httpx\]|scope baseline/i);
	if (/crawl corpus/.test(text)) add(/\[web-scan-crawl\]|\[web-scan-corpus\]|crawl corpus|katana|sitemap|robots/i);
	if (/scanner finding queue/.test(text))
		add(
			/\[web-finding-queue\]|\[web-scan-nuclei\]|\[web-scan-nikto\]|\[web-scan-dalfox\]|nuclei_jsonl|scanner finding/i,
		);
	if (/manual replay verifier/.test(text))
		add(/\[web-scan-verifier\]|manual replay verifier|body_sha256|status_meta=/i);
	if (/observed normalizer/.test(text))
		add(/\[js-signing-normalized\]|observed normalizer|artifact=.*js-observed|normalized artifact/i);
	if (/first divergence/.test(text))
		add(/\[js-first-divergence\]|first[- ]divergence|candidate_signature|expected_signature|suspect=/i);
	if (/signed replay harness/.test(text))
		add(/\[js-replay-harness\]|signed replay harness|REPI_REPLAY_URL|signature_key|status=\d{3}/i);
	if (/symbol\/import map|symbol\/import|string map/.test(text))
		add(/\[native-symbol\]|\[native-import\]|\[native-section\]|symbol\/import map|rabin2|readelf/i);
	if (/comparison sink|compare/.test(text))
		add(/\[native-compare\]|strcmp|strncmp|memcmp|comparison sink|compare trace/i);
	if (/runtime trace/.test(text)) add(/\[native-.*trace\]|strace|ltrace|gdb|runtime trace|info registers|syscall/i);
	if (/patch\/replay proof|patch/.test(text))
		add(/\[native-patch\]|patch hypothesis|replay proof|branch condition|candidate jump/i);
	if (/offset/.test(text)) add(/cyclic|offset|pattern offset|saved rip|saved eip|RIP|EIP|rsp|stack offset/i);
	if (/leak source/.test(text)) add(/leak source|libc base|canary|GOT|PLT|puts@|printf@|address leak|leaked/i);
	if (/controllable bytes/.test(text)) add(/controllable bytes|cyclic|AAAA|payload|overwrite|SIGSEGV|crash|register/i);
	if (/local verifier/.test(text))
		add(/local verifier|verification=pass|exploit success|replay_matrix|exit:?\s*0|success rate/i);
	if (/manifest\/package map/.test(text))
		add(/manifest|package=|aapt|AndroidManifest|apk.*package|manifest\/package/i);
	if (/java\/native hook/.test(text))
		add(/\[repi-frida\]|Frida|Java\.perform|doFinal|MessageDigest|native hook|Interceptor\.attach/i);
	if (/anti-debug/.test(text))
		add(/anti-debug|anti_debug|ptrace|isDebuggerConnected|Debug\.isDebugger|frida|root check/i);
	if (/runtime anchors/.test(text)) add(/runtime anchors|\[frida|\[native|adb devices|hook return|runtime hook/i);
	if (/ipa inventory/.test(text))
		add(/\[ios-ipa\]|\[ios-plist\]|\[ios-binary\]|Info\.plist|CFBundleIdentifier|IPA inventory/i);
	if (/mach-o\/class map/.test(text))
		add(/\[ios-macho\]|\[ios-otool\]|\[ios-symbol\]|\[ios-class\]|\[ios-string\]|Mach-O|class-dump/i);
	if (/frida\/objection hook/.test(text))
		add(
			/\[ios-frida\]|\[ios-hook\]|\[ios-native-hook\]|\[ios-frida-hook-template\]|\[ios-objection\]|objection hook/i,
		);
	if (/network\/keychain replay/.test(text))
		add(/\[ios-network-replay\]|\[ios-network-anchor\]|SecItem|keychain|NSURLSession|signature|pinning/i);
	if (/flow conversation/.test(text))
		add(/flow conversation|tcp\.stream|conversation|capinfos|tshark.*conv|\[pcap-flow\]/i);
	if (/follow-stream/.test(text))
		add(/follow-stream|tcp\.stream eq|tshark.*-z follow|stream ranking|\[pcap-stream\]/i);
	if (/carved object/.test(text))
		add(/carved object|foremost|extracted artifact|HTTP object|export objects|\[pcap-extract\]/i);
	if (/timeline evidence/.test(text))
		add(/timeline evidence|credential timeline|\[pcap-secret\]|frame\.time|timestamp/i);
	if (/image profile/.test(text))
		add(
			/\[mem-image\]|\[mem-vol-info\]|volatility3.*(?:windows\.info|linux\.banners|mac\.banners)|sample_sha256|image profile/i,
		);
	if (/process\/network map/.test(text))
		add(/\[mem-process\]|\[mem-vol\].*(?:pslist|pstree|cmdline|netscan|sockstat|netstat)|process\/network/i);
	if (/credential\/artifact proof/.test(text))
		add(
			/\[mem-credential\]|\[mem-vol-credential\]|hashdump|lsadump|Authorization|Cookie|AWS_ACCESS_KEY|credential\/artifact/i,
		);
	if (/timeline\/carve evidence/.test(text))
		add(/\[mem-timeline\]|\[mem-vol-timeline\]|\[mem-carve\]|malfind|filescan|dumpfiles|timeliner|timeline\/carve/i);
	if (/filesystem extraction/.test(text))
		add(/filesystem extraction|rootfs|squashfs|unsquashfs|binwalk|unblob|\[firmware-extract\]/i);
	if (/service map/.test(text))
		add(/service map|inetd|dropbear|httpd|telnetd|listening|cgi-bin|\[firmware-service\]/i);
	if (/credential\/config proof/.test(text))
		add(/credential\/config proof|passwd|shadow|config secret|nvram|password|private key|\[firmware-config\]/i);
	if (/emulation notes/.test(text)) add(/emulation notes|qemu|chroot|firmware-emulation|qemu-mips|qemu-arm/i);
	if (/parameter derivation/.test(text))
		add(/parameter derivation|modulus|exponent|iv=|nonce=|oracle|Z3|Sage|lattice|\[crypto-param\]/i);
	if (/solver script/.test(text)) add(/solver script|solve\.py|z3|sage|known answer|assert .*==|\[crypto-solver\]/i);
	if (/known-answer test/.test(text)) add(/known-answer|known answer|KAT|assert .*==|test vector|verification=pass/i);
	if (/transform replay/.test(text))
		add(/transform replay|decode chain|base64|xor|openssl|pipeline|\[crypto-transform\]/i);
	if (/token source/.test(text))
		add(/token source|serviceaccount|AWS_ACCESS_KEY_ID|metadata|IMDS|credential_process|k8s-serviceaccount/i);
	if (/credential usability/.test(text))
		add(/credential usability|sts get-caller-identity|can-i|nxc|ldapsearch|klist|valid credential/i);
	if (/privilege edge/.test(text))
		add(/privilege edge|rbac|iam|ClusterRoleBinding|GenericAll|WriteDacl|AdminTo|can-i/i);
	if (/graph\/path evidence/.test(text))
		add(/graph\/path evidence|BloodHound|ad-graph-edge|attack_graph|path proof|edge=/i);
	if (/multi-run success rate/.test(text))
		add(/multi-run success rate|success rate|replay matrix|runs=\d+|passed=\d+|failed=\d+/i);
	if (/stdout\/stderr hash/.test(text)) add(/stdout_sha256|stderr_sha256|stdout\/stderr hash|body_hash|sha256/i);
	if (/environment pin/.test(text)) add(/environment pin|ldd|Dockerfile|uname|libc|node --version|python.*version/i);
	if (/bundle manifest/.test(text)) add(/bundle manifest|manifest\.json|artifact bundle|bundle_path|tar\.gz/i);
	if (/ioc\/config/.test(text)) add(/IOC|malware-ioc|config extractor|C2|mutex|YARA|capa|FLOSS/i);
	if (/behavior trace/.test(text)) add(/malware-behavior|strace|execve|connect|openat|anti-debug|syscall/i);
	if (/prompt surface/.test(text)) add(/prompt surface|agent-prompt|systemPrompt|developer|prompt injection/i);
	if (/tool boundary/.test(text))
		add(/tool boundary|agent-tool|registerTool|tool schema|function_call|ToolCallTraceLedgerV1/i);
	if (/memory poisoning/.test(text))
		add(/memory poisoning|agent-memory|RAG|retrieval|injection-packet|quarantine|poison/i);
	if (/injection replay/.test(text))
		add(/injection replay|agent-injection|prompt injection|replay harness|untrusted content|boundary decision/i);
	if (/static triage/.test(text)) add(/malware-static|entropy|sha256|format_hint|static triage/i);
	if (/rule\/capability/.test(text))
		add(/malware-yara|malware-capa|malware-floss|YARA|capa|rule\/capability|capability signal/i);
	if (regexes.length === 0) {
		const words = proofExit
			.split(/[^A-Za-z0-9_@.-]+/)
			.filter((word: any) => word.length >= 4)
			.map(escapeRegExp);
		if (words.length) regexes.push(new RegExp(words.join(".*"), "i"));
	}
	if (/mitigation|checksec|nx|pie|relro|canary/.test(text))
		add(
			/\[native-checksec\]|\[native-mitigation\]|\[pwn-mitigation\]|checksec|RELRO|Stack.*Canary|NX enabled|PIE enabled|No canary/i,
		);
	if (/offset|cyclic|crash control|controllable bytes/.test(text))
		add(/\[native-gdb\]|\[pwn-exec-run\]|cyclic|offset=|RIP|EIP|pc=|bt full|controllable/i);
	if (/leak source|libc|got|plt/.test(text))
		add(/\[native-ldd\]|\[native-ropgadget\]|libc\.so|GOT|PLT|puts@|printf@|leak/i);
	if (/one_gadget|seccomp|sandbox syscall/.test(text))
		add(/\[one_gadget\]|\[seccomp\]|one_gadget|seccomp-tools|SECCOMP|syscall filter/i);
	if (/java\/native hook|frida|objection|hook output/.test(text))
		add(/\[android-frida\]|\[ios-frida\]|\[mobile-hook\]|Java\.perform|ObjC\.available|Interceptor\.attach|frida/i);
	if (/manifest\/package map|package map/.test(text))
		add(/\[android-apk\]|\[mobile-ios-info\]|package:|sdkVersion|CFBundleIdentifier|aapt|badging/i);
	if (/flow conversation|follow-stream|tcp stream/.test(text))
		add(/\[flow-conversation\]|\[tcp-reassembly\]|\[http-object\]|\[pcap-protocol\]|tcp\.stream|follow,http/i);
	if (/timeline evidence|credential timeline/.test(text))
		add(/\[credential-timeline\]|\[mem-netscan\]|\[mem-pslist\]|Authorization:|Set-Cookie|password=/i);
	if (/carved object|filesystem map|rootfs/.test(text))
		add(
			/\[firmware-extract\]|\[firmware-config\]|\[firmware-secret\]|\[firmware-elf\]|squashfs-root|rootfs|binwalk/i,
		);
	// Always accept runtime capture / bind_ready markers as proof-exit evidence.
	add(/proof\.exit\s*=\s*(?:partial_runtime_capture|runtime_capture_strong)/i);
	add(/query\.proof_exit\s*=\s*(?:partial_runtime_capture|runtime_capture_strong)/i);
	add(/bind_ready\s*=\s*true/i);
	add(
		/\[native-proof-capture\]|\[mobile-proof-capture\]|\[exploit-lab-proof-capture\]|\[browser-proof-capture\]|\[web-authz-proof-capture\]|\[js-signing-proof-capture\]/i,
	);
	return regexes;
}
