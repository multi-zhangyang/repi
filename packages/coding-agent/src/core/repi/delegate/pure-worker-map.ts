/** Delegate worker mapping + adaptive tools. */
import type { DelegateWorker } from "./types.ts";

export function adaptiveToolsForWorker(worker: DelegateWorker, entries: any[]): string[] {
	const entry = entries.find((item: any) => item.worker === worker);
	if (!entry || entry.score >= 80) return [];
	const extra: Record<DelegateWorker, string[]> = {
		"web-authz": ["re_web_authz_state", "playwright", "curl"],
		identity: ["re_verifier", "jq", "python3"],
		cloud: ["kubectl", "aws", "jq"],
		"mobile-runtime": ["frida", "adb", "jadx"],
		"native-runtime": ["gdb", "r2", "readelf"],
		"pwn-exploit": ["gdb", "python3", "ROPgadget"],
		"firmware-dfir": ["binwalk", "tshark", "python3"],
		agentsec: ["rg", "jq", "python3"],
		malware: ["yara", "capa", "strings"],
		reporting: ["re_compiler", "re_complete", "python3"],
		general: ["re_verifier", "re_replayer", "python3"],
	};
	return extra[worker];
}

export function delegateWorkerForStep(step: any): DelegateWorker {
	const text = `${step.phase}\n${step.command}`;
	if (/web-authz|surface|state|poc|api|websocket|graphql|jwt|cookie|session|idor|bola|authz/i.test(text))
		return "web-authz";
	if (/credential|principal|kerberos|ldap|ntlm|ticket|hash|identity/i.test(text)) return "identity";
	if (/cloud|container|k8s|kubernetes|metadata|serviceaccount|iam|rbac|privilege/i.test(text)) return "cloud";
	if (/mobile|android|ios|apk|ipa|frida|objection|smali|jni|objc|swift|emulator/i.test(text)) return "mobile-runtime";
	if (/pwn|exploit|primitive|mitigation|rop|heap|overflow|shellcode|pwntools|flake|bundle/i.test(text))
		return "pwn-exploit";
	if (/native|elf|pe|macho|binary|gdb|lldb|checksec|r2|radare|ghidra|ida|symbol|breakpoint|loader|libc/i.test(text))
		return "native-runtime";
	if (/firmware|pcap|dfir|forensic|rootfs|tshark|binwalk|extract|filesystem|emulate|timeline|decode/i.test(text))
		return "firmware-dfir";
	if (/agentsec|agent|prompt|tool-boundary|memory|injection|delegation|mcp|rag/i.test(text)) return "agentsec";
	if (/malware|ioc|yara|capa|floss|static-config|behavior|c2/i.test(text)) return "malware";
	if (/report|complete|scaffold|audit|writeup/i.test(text)) return "reporting";
	return "general";
}

export function isDelegateWorker(value: string): value is DelegateWorker {
	return [
		"web-authz",
		"identity",
		"cloud",
		"mobile-runtime",
		"native-runtime",
		"pwn-exploit",
		"firmware-dfir",
		"agentsec",
		"malware",
		"reporting",
		"general",
	].includes(value);
}
