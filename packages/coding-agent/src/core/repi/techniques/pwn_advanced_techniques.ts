/** Technique catalog slice: pwn advanced (ret2dl/one_gadget/seccomp). */
import type { TechniqueEntry } from "./types.ts";

export const PWN_ADVANCED_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "pwn-ret2dlresolve",
		name: "ret2dlresolve (forge linkmap + Relocation entry)",
		domain: "pwn",
		mitre: ["T1055", "T1068"],
		cwe: ["CWE-121"],
		triggers:
			"No libc leak available, partial RELRO or no RELRO, you control enough stack/bss to plant a fake `Elf64_Rela` + `Elf64_Sym` + `strtab` string, want to call an arbitrary libc symbol (e.g. `system`) without knowing libc base.",
		procedure: [
			"Compute offsets so the fake relocation entry, symbol, and `strtab` string (e.g. `system\\0`) line up at addresses the runtime resolver indexes.",
			"Set up the resolver call: `PLT[0]` (the lazy-resolver stub) with the relocation index pointing at your forged entry.",
			"Place `/bin/sh` address in rdi, call the forged `system`.",
			"Use pwntools `Ret2dlresolvePayload` to compute the fake structures when the binary is No-PIE / has a writable, known-address staging area.",
		],
		proofExit: "Arbitrary libc symbol resolved and called without a libc leak; PoC shell ≥3/3.",
		pitfalls: [
			"Full RELRO binds symbols at load — ret2dlresolve is dead; check RELRO first.",
			"PIE binaries need a leak to know where to plant the fake structures; without it, ret2dlresolve is impractical.",
			"Versioned symbol checks (glibc >=2.30 `dl_runtime_resolve` adds symbol-version validation) can break classic payloads — use `Ret2dlresolvePayload` with the binary's linker.",
		],
		tools: ["gdb", "pwn", "python3", "readelf", "objdump"],
	},
	{
		id: "pwn-one-gadget-constraint",
		name: "one_gadget constraint selection under NX",
		domain: "pwn",
		mitre: ["T1055", "T1068"],
		cwe: ["CWE-121"],
		triggers:
			"NX enabled, libc leak available, stack/register constraints may allow a single gadget to spawn /bin/sh without full ROP chain.",
		procedure: [
			"Identify libc: `ldd binary` / leak two symbols and match with `pwn libcdb` / local libc path.",
			"Enumerate gadgets: `one_gadget libc.so.6` and record constraints (e.g. [rsp+0x40]==NULL, r12==NULL).",
			"In gdb/pwndbg at the control point, dump registers and stack slots that appear in constraints (`regs`, `telescope $sp 20`).",
			"Pick the first constraint-satisfied gadget; if none, free a register with a short ROP (`pop rdi; ret` / `ret` alignment) then re-check.",
			"Build payload: overflow → optional leak loop → one_gadget; run locally ≥3 times before remote.",
			"Record proof: `REPI_NATIVE_RUN=1 re_native_runtime run <bin>` + `re_exploit_lab run <bin> 5` and keep stdout hashes.",
		],
		proofExit:
			"one_gadget address resolved from leaked libc base; local shell or controlled crash-to-shell ≥3/3; constraints explicitly satisfied in register dump.",
		pitfalls: [
			"Using a gadget whose constraints are not met yields silent exit or crash — always dump regs at control point.",
			"Different libc builds shift one_gadget offsets; never mix remote libc with local gadgets.",
			"x86-64 SysV 16-byte stack alignment still matters before some libc paths — insert a `ret` if needed.",
		],
		tools: ["one_gadget", "gdb", "pwn", "python3", "checksec", "ldd"],
	},
	{
		id: "pwn-seccomp-sandbox-escape-map",
		name: "seccomp/syscall filter map before shellcode/ROP",
		domain: "pwn",
		mitre: ["T1055", "T1611"],
		cwe: ["CWE-284", "CWE-863"],
		triggers:
			"Binary or parent installs seccomp-bpf; execve/open may be blocked; need allowed-syscall map before final payload.",
		procedure: [
			"Dump filter: `seccomp-tools dump ./binary` (or attach with `seccomp-tools dump -c 'run'`).",
			"Classify mode: kill/trap/errno and list allowed syscalls (read/write/openat/execve/socket...).",
			"If execve blocked, pivot to ORW (open-read-write flag) or mprotect+shellcode only if allowed.",
			"Cross-check with strace under crash input: `strace -f ./binary <payload 2>&1 | head`.",
			"Encode allowed set into exploit notes; refuse payloads that call blocked syscalls.",
			"Bridge: `re_native_runtime run <bin>` then specialist `pwn-primitive-one-gadget-seccomp`.",
		],
		proofExit:
			"seccomp filter text captured with action+syscall list; final payload only uses allowed syscalls and still achieves flag/shell proof.",
		pitfalls: [
			"Child processes may install a stricter filter after fork — dump both parent and post-prctl states.",
			"libseccomp default actions differ by distro; always dump the actual binary filter, not assumptions.",
		],
		tools: ["seccomp-tools", "strace", "gdb", "pwn", "python3", "checksec"],
	},
	{
		id: "pwn-orw-seccomp-bypass",
		name: "Open-read-write shellcode/ROP under execve-blocked seccomp",
		domain: "pwn",
		mitre: ["T1059", "T1068"],
		cwe: ["CWE-78", "CWE-269"],
		triggers:
			"Challenge installs seccomp that blocks execve/execveat but allows open/read/write/openat; shell one-gadgets fail.",
		procedure: [
			"Dump filter: `seccomp-tools dump ./bin` or qemu user + strace; list allowed syscalls.",
			"If open/read/write allowed: build ORW chain — open('flag',0) → read(fd,buf,n) → write(1,buf,n).",
			"Prefer ROP over raw shellcode when NX is on; for shellcode stages use mprotect only if allowed.",
			"Path candidates: ./flag, flag, /flag, /home/*/flag — probe with open failures in debugger.",
			"Automate with pwntools cyclic offset + stage payloads; freeze remote libc if needed for gadgets.",
		],
		proofExit:
			"Flag bytes appear on stdout from ORW path; replaying the same payload recovers the same content under the same seccomp profile.",
		pitfalls: [
			"Assuming system()/execve works under seccomp.",
			"Wrong flag path — enumerate from binary strings and cwd.",
			"Buffer too small for flag — size read >= 0x100.",
		],
		tools: ["seccomp-tools", "gdb", "python3", "strace", "ROPgadget"],
	},
];
