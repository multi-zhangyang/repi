/** Lexical target signals for runtime adapter inspect. */
import type { RuntimeAdapterTargetKind, RuntimeAdapterTargetSignalV1 } from "./types.ts";

type TargetSignalAdd = (
	adapterId: string,
	targetKind: RuntimeAdapterTargetKind,
	reason: string,
	evidenceRank: RuntimeAdapterTargetSignalV1["evidenceRank"],
) => void;

export function appendLexicalTargetSignals(
	text: string,
	lower: string,
	targetKind: "file" | "directory" | undefined,
	add: TargetSignalAdd,
): void {
	if (/^https?:\/\//i.test(text)) add("web-cdp-network-adapter", "web-url", "http url target", "network");
	if (/\.(?:har)(?:$|[?#\s])/.test(lower))
		add("web-cdp-network-adapter", "web-url", "HAR network archive target", "network");
	if (
		/^(?:ws|wss):\/\//i.test(text) ||
		/\b(?:devtools\/browser|cdp|chrome-debugging|remote-debugging-port)\b/i.test(text)
	) {
		add("web-cdp-network-adapter", "cdp-endpoint", "cdp/websocket endpoint target", "network");
	}
	if (
		/\b(?:xhr|websocket|cookie|authorization|graphql|api|signed request)\b/i.test(text) ||
		(/\b(?:nonce|timestamp)\b/i.test(text) && /https?:\/\/|\b(?:xhr|fetch|header|cookie|session)\b/i.test(text))
	) {
		add("web-cdp-network-adapter", "web-url", "web api/replay lexical signal", "network");
	}
	if (
		/\b(?:crypto|cryptography|rsa|aes|rc4|chacha(?:20)?|salsa20|cbc|ecb|gcm|padding oracle|lattice|sage|\bz3\b|hashcat|stego|xor|modulus|exponent|ecdsa|elliptic)\b/i.test(
			text,
		)
	) {
		add("crypto-param-transform-adapter", "crypto-artifact", "crypto/stego lexical signal", "runtime_artifact");
	}
	if (
		targetKind !== "directory" &&
		(/\.(?:pcapng?|pcap|cap)(?:$|[?#\s])/.test(lower) || /\b(?:pcap|tshark|wireshark|packet|flow)\b/.test(lower))
	) {
		add("tshark-pcap-flow-adapter", "pcap-flow", "pcap/flow lexical signal", "network");
	}
	if (
		/\.(?:apk|ipa)(?:$|[?#\s])/.test(lower) ||
		/\b(?:frida|android|ios|objc|swift|keychain|okhttp|trustmanager|certificatepinner|jadx|dex|apktool)\b/.test(
			lower,
		) ||
		/^([a-z][a-z0-9_]*\.){2,}[a-z][a-z0-9_]*$/i.test(text)
	) {
		add("frida-mobile-hook-adapter", "mobile-package", "mobile package/runtime lexical signal", "runtime_artifact");
	}
	if (/\b(?:rootfs|openwrt-root|busybox-root|squashfs-root|init\.d|dropbear|uci)\b/.test(lower)) {
		add("firmware-rootfs-service-map-adapter", "firmware-rootfs", "rootfs/service lexical signal", "process_config");
	}
	if (
		/\.(?:bin|img|trx|chk|ubi|ubifs|squashfs|sqsh|uimage)(?:$|[?#\s])/.test(lower) ||
		/\b(?:firmware|rootfs|openwrt|busybox|u-boot|uboot|mtd|jffs2|cramfs)\b/.test(lower)
	) {
		add("binwalk-firmware-extract-adapter", "firmware-image", "firmware image lexical signal", "runtime_artifact");
	}
	if (/\b(?:pwn|exploit|rop|ret2|heap|tcache|format string|one_gadget|pwntools)\b/i.test(text)) {
		add("pwntools-local-verifier-adapter", "pwn-binary", "pwn/exploit lexical signal", "runtime_artifact");
	}
	if (/\b(?:gdb|breakpoint|register|core dump|coredump|sigsegv|crash)\b/i.test(text)) {
		add("gdb-native-trace-adapter", "native-binary", "debugger/crash lexical signal", "runtime_artifact");
	}
	if (
		/\b(?:radare2|\br2\b|xref|symbol|import|decompile|elf|pe|dll|so|wasm|binary|native|license|strcmp|memcmp)\b/i.test(
			text,
		) ||
		/\.(?:elf|exe|dll|so|wasm|dylib)(?:$|[?#\s])/.test(lower)
	) {
		add("r2-native-xref-adapter", "native-binary", "native reverse lexical signal", "runtime_artifact");
	}
	if (
		/\b(?:cloud|aws|azure|gcp|imds|metadata service|sts|iam|kubectl|kubernetes|k8s|docker\.sock|ecs|eks|gke|serviceaccount|kubeconfig)\b/i.test(
			text,
		)
	) {
		add(
			"cloud-identity-host-adapter",
			"cloud-identity",
			"cloud/identity host inventory lexical signal",
			"process_config",
		);
	}
	if (
		/\b(?:agent[-_ ]?security|prompt injection|tool injection|jailbreak|mcp|model context protocol|host harness|permission boundary|llm\s*安全|agent\s*安全)\b/i.test(
			text,
		)
	) {
		add(
			"agent-security-boundary-adapter",
			"agent-security",
			"agent/LLM boundary host harness lexical signal",
			"runtime_artifact",
		);
	}
	if (
		/\b(?:memory forensics|memdump|volatility|pslist|malfind|hiberfil|pagefile|\bvol(?:atility)?3?\b|mem\.dmp|memory image|lsass dump)\b/i.test(
			text,
		)
	) {
		add(
			"memory-forensics-host-adapter",
			"memory-forensics",
			"memory forensics host lexical signal",
			"runtime_artifact",
		);
	}
}
