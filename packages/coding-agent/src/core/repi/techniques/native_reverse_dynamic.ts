/** Technique catalog slice: native-reverse. */
import type { TechniqueEntry } from "./types.ts";

export const NATIVE_REVERSE_DYNAMIC_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "rev-anti-vm-unpack-stage",
		name: "Anti-VM packer stage map and controlled unpack",
		domain: "native-reverse",
		mitre: ["T1027", "T1497"],
		cwe: ["CWE-506"],
		triggers: "Packed PE/ELF with UPX-like entropy, anti-debug/anti-vm checks before OEP.",
		procedure: [
			"Entropy/section map: `rabin2 -I/-S`, detect high-entropy .upx/.themida sections.",
			"Identify anti-VM: cpuid, RDTSC, registry/files (VBox/VMWare), timing loops via xrefs.",
			"Break on VirtualAlloc/VirtualProtect/mprotect/NtWriteVirtualMemory to catch unpacked image.",
			"Dump OEP memory; rebuild IAT if needed; re-run strings/checksec on dump.",
			"Document packer family, OEP, and dump path as evidence artifacts.",
		],
		proofExit:
			"Unpacked image dump with lower entropy and recovered imports/strings that were absent in the packed sample.",
		pitfalls: [
			"Dumping mid-unpack yields incomplete IAT.",
			"Anti-debug single-step detection — use hardware bp / syscall tracing.",
		],
		tools: ["r2", "rabin2", "gdb", "x64dbg", "pe-sieve", "strings"],
	},
	{
		id: "native-angr-symbolic-branch",
		name: "Angr/symbolic branch constraint recovery",
		domain: "native-reverse",
		mitre: ["T1059", "T1622"],
		cwe: ["CWE-693"],
		triggers:
			"ELF compare/branch maze where static CFG is large but a single constrained path yields license/flag bytes.",
		procedure: [
			"Fingerprint arch/bits/entry; dump imports for strcmp/memcmp/read/fgets.",
			"Load binary in angr or equivalent; hook compare sinks; explore to success/fail addresses.",
			"Dump constrained stdin/argv/file bytes at success state; validate offline with concrete run.",
			"Record solver constraints, success addr, and concrete input hash as proof-exit evidence.",
			"If symbolic fails, fall back to gdb compare-trace + differential inputs.",
		],
		proofExit:
			"Concrete input recovered from constraints that reaches the success branch with matching runtime anchors.",
		pitfalls: [
			"Unconstrained symbolic explosion — bound path depth and sink addresses.",
			"Do not claim solver success without replaying the concrete input on the real binary.",
		],
		tools: ["angr", "python3", "gdb", "r2", "readelf"],
	},
];
