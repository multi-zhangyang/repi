/**
 * Technique catalog slice: memory-forensics.
 */
import type { TechniqueEntry } from "./types.ts";

export const MEMORY_FORENSICS_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "mem-vol3-triage-network",
		name: "volatility3 quick triage: banners/pslist/netscan",
		domain: "memory-forensics",
		mitre: ["T1003", "T1049"],
		cwe: ["CWE-200"],
		triggers:
			"Raw/vmem/dmp memory image; need OS profile, process tree, and network sockets before deep credential dumps.",
		procedure: [
			"Inventory: `file`/`sha256sum`; size sanity; note hibernation vs full RAM.",
			"OS banners/info: `vol -f img banners.Banners` / `windows.info.Info` (or linux.banner).",
			"Process tree: `windows.pslist`/`pstree` (or linux.pslist); flag odd parents, injected names.",
			"Network: `windows.netscan`/`netstat`; correlate PIDs to remote C2.",
			"Only then dump LSASS/creds (`mem-volatility-creds`) or malfind/filescan.",
			"Bridge: specialist `memory-forensics-vol3-quick-triage` + `re_domain_proof_exit show memory-forensics`.",
		],
		proofExit:
			"[mem-banner]/[mem-wininfo]/[mem-pslist]/[mem-netscan] (or linux equivalents) with PID↔socket correlation notes.",
		pitfalls: [
			"Wrong symbol table yields empty plugins — fix ISF/profile before claiming no processes.",
			"Partial VM snapshots may lack pagefile-backed memory; mark evidence confidence.",
		],
		tools: ["volatility3", "vol", "file", "sha256sum", "strings", "python3"],
	},
	{
		id: "mem-volatility-creds",
		name: "Memory credential extraction (LSASS / password hashes)",
		domain: "memory-forensics",
		mitre: ["T1003", "T1003.002"],
		cwe: ["CWE-522"],
		triggers:
			"Memory image (`.raw`/`.vmem`/`.dmp`) of a Windows host with LSASS present; volatility3 + a matching profile/symbol table.",
		procedure: [
			"Identify the image: `vol -f img.raw windows.info`; ensure symbol tables are available (ISF).",
			"`windows.pslist`/`pstree` → locate `lsass.exe` (PID).",
			"`windows.memmap --pid <lsass> --dump` → LSASS dump; parse with `pypykatz`/`mimikatz` for NTLM/Kerberos/Wdigest creds.",
			"Also `windows.credist`/`windows.hashdump` if the plugin supports the image; `windows.netscan` for connections.",
		],
		proofExit:
			"Recovered credential material (NT hash/kerb ticket) validated usable (PtH/auth) from the captured image.",
		pitfalls: [
			"Wrong profile/symbol table → plugins error; pin via `windows.info` first.",
			"Wdigest disabled on modern Windows → no cleartext; expect hashes/tickets.",
		],
		tools: ["volatility3", "python3", "yara", "strings"],
	},
	{
		id: "mem-process-hunt",
		name: "Memory malicious-process / injection hunt",
		domain: "memory-forensics",
		mitre: ["T1055", "T1055.001", "T1071.001"],
		cwe: ["CWE-693"],
		triggers: "Memory image for DFIR; need to find injected code / hollowed processes / C2 beacons.",
		procedure: [
			"`windows.malfind` → regions with PAGE_EXECUTE_READWRITE + no backing PE (injected shellcode).",
			"`windows.dlllist`/`windows.handles` → anomalies (unsigned DLLs, suspicious handles).",
			"Correlate `windows.netscan` C2 connections to the owning PID; dump the suspect process memory + the injected region.",
			"Scan dumps with `yara` (Cobalt Strike beacon signatures) + `capa`.",
		],
		proofExit:
			"Injected/unbacked executable region tied to a process + a matching C2 signature, reproducible across re-runs on the image.",
		pitfalls: [
			"Legitimate JIT regions (CLR/V8) also RX+unbacked — corroborate with the owning process + network.",
			"`malfind` is noisy — prioritize by network + parent-process anomalies.",
		],
		tools: ["volatility3", "yara", "capa", "strings", "python3"],
	},
];
