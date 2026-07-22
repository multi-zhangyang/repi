/** Technique catalog slice: native-reverse. */
import type { TechniqueEntry } from "./types.ts";

export const NATIVE_REVERSE_PWN_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "rev-checksec-fingerprint-first",
		name: "ELF mitigation fingerprint before deep reverse",
		domain: "native-reverse",
		mitre: ["T1622"],
		cwe: ["CWE-693"],
		triggers:
			"New ELF/PE target; need architecture, mitigations, imports, and interesting strings before decompile or patch hypotheses.",
		procedure: [
			"`file` + `sha256sum` for identity; refuse directory targets until candidate file is selected.",
			"`checksec --file=bin` (or readelf GNU_STACK/RELRO/BIND_NOW + __stack_chk_fail) for NX/PIE/canary/RELRO/Fortify.",
			"`readelf -hW/-dW` + `rabin2 -I/-i` (or `r2 -qq -c 'iI; ii'`) for arch, interpreter, imports.",
			"`strings -a -n 5` filtered for license/key/flag/password/strcmp; seed xref targets.",
			"Only then open ghidra/r2 for control-flow; attach gdb with REPI_NATIVE_RUN for runtime compare sinks.",
			"Bridge: `re_map` → `re_native_runtime run` → `re_domain_proof_exit show rev-native`.",
		],
		proofExit:
			"[native-checksec]/[native-rabin-info]/[native-file] evidence present with arch+mitigations+hash; deep reverse starts from that fingerprint.",
		pitfalls: [
			"Running decompiler on a whole directory wastes context — always fingerprint one candidate binary first.",
			"Static checksec without loader path can miss custom interpreters; record INTERP/RPATH when present.",
		],
		tools: ["file", "sha256sum", "checksec", "readelf", "rabin2", "r2", "strings", "gdb"],
	},
	{
		id: "rev-rop-chain-ret2csu",
		name: "ROP chain construction with ret2csu / partial-write",
		domain: "native-reverse",
		mitre: ["T1055", "T1068"],
		cwe: ["CWE-121", "CWE-787"],
		triggers:
			"NX-enabled ELF, no complete one-gadget, need controlled argument registers (rdi/rsi/rdx) before libc call; common on x86_64 with limited gadgets.",
		procedure: [
			"Inventory gadgets: `ROPgadget --binary $BIN --only 'pop|ret|syscall|leave'` and/or `ropper --file $BIN --search 'pop rdi'`.",
			"If missing pop rdx/rsi, map `__libc_csu_init` gadgets (ret2csu): pop rbx/rbp/r12-r15; call [r12+rbx*8]; add rsp cleanup.",
			"Leak a libc pointer (puts/write GOT) with first ROP stage; compute libc base from remote leak.",
			"Second stage: system('/bin/sh') or open-read-write (ORW) if seccomp blocks execve; prove with interactive shell or flag read.",
			"Record offsets: gadget VAs, leaked GOT, libc version, and final payload hex for replay.",
		],
		proofExit:
			"Controlled ROP reaches libc call with intended arguments; shell/flag output is reproducible from the recorded payload without re-deriving gadgets.",
		pitfalls: [
			"Wrong libc version for leak offsets — pin remote libc via build-id or strings.",
			"Stack alignment (movaps crash) — insert ret for 16-byte alignment before system.",
			"Partial RELRO still allows GOT overwrite; FULL RELRO forces ret2csu/stack pivot instead.",
		],
		tools: ["ROPgadget", "ropper", "gdb", "python3", "readelf", "objdump"],
	},
];
