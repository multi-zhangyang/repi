/** Proof-loop gap worker routing from text. */
import type { RepiProofLoopDelegateWorker } from "./types.ts";

type RepiProofLoopMissionContext = any;

export function repiProofLoopWorkerForText(
	text: string,
	mission?: RepiProofLoopMissionContext,
): RepiProofLoopDelegateWorker {
	const haystack = `${mission?.route?.domain ?? ""}\n${mission?.task ?? ""}\n${text}`;
	if (
		/web-authz|web|api|http|xhr|fetch|websocket|graphql|jwt|cookie|session|idor|bola|authz|csrf|cors/i.test(haystack)
	)
		return "web-authz";
	if (/mobile|android|ios|apk|ipa|frida|objection|smali|jni|objc|swift|emulator/i.test(haystack))
		return "mobile-runtime";
	if (/cloud|container|docker|k8s|kubernetes|metadata|serviceaccount|iam|rbac|privilege/i.test(haystack))
		return "cloud";
	if (/credential|principal|kerberos|ldap|ntlm|ticket|hash|identity|active directory|bloodhound/i.test(haystack))
		return "identity";
	if (/firmware|pcap|dfir|forensic|rootfs|tshark|binwalk|extract|filesystem|emulate|timeline|decode/i.test(haystack))
		return "firmware-dfir";
	if (/agentsec|agent|prompt|tool-boundary|memory|injection|delegation|mcp|rag|sub-agent/i.test(haystack))
		return "agentsec";
	if (/malware|ioc|yara|capa|floss|static-config|behavior|c2/i.test(haystack)) return "malware";
	if (/pwn|exploit|primitive|mitigation|rop|heap|overflow|shellcode|pwntools|crash|leak|gadget/i.test(haystack))
		return "pwn-exploit";
	if (
		/native|elf|pe|macho|binary|gdb|lldb|checksec|r2|radare|ghidra|ida|symbol|breakpoint|loader|libc/i.test(haystack)
	)
		return "native-runtime";
	if (/report|complete|writeup|compiler|final/i.test(haystack)) return "reporting";
	return "general";
}
