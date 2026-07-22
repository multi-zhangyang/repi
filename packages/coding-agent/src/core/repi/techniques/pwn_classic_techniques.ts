/** Technique catalog slice: pwn classic (ret2libc/fmt/srop). */
import type { TechniqueEntry } from "./types.ts";

export const PWN_CLASSIC_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "pwn-ret2libc",
		name: "ret2libc (leak → libc base → system/one_gadget)",
		domain: "pwn",
		mitre: ["T1055", "T1068"],
		cwe: ["CWE-121"],
		triggers:
			"Stack buffer overflow, NX enabled (no shellcode), binary is dynamically linked against libc, a libc leak or GOT read is reachable.",
		procedure: [
			"Find offset to saved RIP with `pwn cyclic` + gdb crash (`cyclic -l $rsp_value`).",
			"Leak a libc address: call `puts@plt` with `pop rdi; ret` gadget on a GOT entry (e.g. `puts@got`), return to main to loop.",
			"Compute libc base = leaked puts − `puts` offset in the matching libc (identify libc via `libc-database` / `pwn libc` / leak 2 symbols).",
			'Second stage: ret2 `system("/bin/sh")` or a `one_gadget` constraint-satisfied address; add a `ret` gadget for 16-byte stack alignment on x86-64 SysV.',
			"Run locally ≥3 times; then point at remote with the SAME libc.",
		],
		proofExit:
			"Local interactive shell ≥3/3 with `id`/flag captured; libc base printed and matches expected offset math.",
		pitfalls: [
			"Wrong libc build → wrong base → SIGSEGV; always fingerprint the remote libc (2 leaked symbols), never assume.",
			"one_gadget constraints (e.g. `rsp+0x40 == NULL`) frequently fail; prefer `system`+`/bin/sh` or chain a `pop rdi`.",
			"Missing alignment `ret` causes `movaps` crash in `system`.",
		],
		tools: ["gdb", "pwn", "python3", "ROPgadget", "one_gadget", "readelf"],
	},
	{
		id: "pwn-format-string",
		name: "format-string arbitrary write (printf %n)",
		domain: "pwn",
		mitre: ["T1055", "T1068"],
		cwe: ["CWE-134"],
		triggers:
			"User input reaches a `printf`-family call as the format string (no constant format), binary prints user bytes directly.",
		procedure: [
			"Confirm control: send `%p.%p.%p...` and observe stack/heap pointers echoed; find your input's offset with `AAAA%p.%p...` matching `0x41414141`.",
			"Decide target (GOT entry, return address, `__free_hook` pre-2.34, stack saved RIP).",
			"Use `%n`/`%hn`/`%hhn` with width padding to write the target value at the address you place on the stack/buffer.",
			"For large values write 2 bytes at a time (`%hn`) to avoid giant padding; place the target address at the right argument offset.",
			"With pwntools: `fmtstr_payload(offset, {target: value}, write_size='short')`.",
		],
		proofExit:
			"Arbitrary write verified in gdb (target changed to your value) + control flow redirected to a chosen address + PoC ≥3/3.",
		pitfalls: [
			"`%n` disabled in some hardened libcs (`__printf_enable`); check before relying on it.",
			"Offset math is positional — recalc per binary, don't reuse.",
			"Writing full 4/8-byte values via `%n` needs huge padding and often truncates; use `%hn`/`%hhn`.",
		],
		tools: ["gdb", "pwn", "python3", "objdump", "readelf"],
	},
	{
		id: "pwn-srop",
		name: "SROP / Sigreturn-Oriented Programming",
		domain: "pwn",
		mitre: ["T1055", "T1068"],
		cwe: ["CWE-121"],
		triggers:
			"Small ROP gadget budget, a syscall gadget available, `sigreturn` (syscall 15 on amd64) reachable, no libc leak (sigreturn needs no libc).",
		procedure: [
			"Find a `syscall; ret` gadget and a way to set rax=15 (e.g. a `read` returning exactly 15 bytes, or a `pop rax; ret`).",
			"Forge a SigreturnFrame on the stack: set rip=`syscall`, rax=execve(59), rdi=`/bin/sh` addr, rsi=0, rdx=0, cs=0x33, ss=0x2b (correct user-mode segment selectors).",
			"Trigger sigreturn: the kernel pops the entire frame into registers and resumes at rip — execve runs.",
			"With pwntools: `SigreturnFrame()` + `SigreturnFrame(kernel='amd64')`.",
		],
		proofExit: "execve('/bin/sh') runs without any libc, PoC ≥3/3; frame registers verified in gdb pre-syscall.",
		pitfalls: [
			"Wrong segment selectors (cs/ss) → kernel refuses the frame or rings mismatch; amd64 user: cs=0x33, ss=0x2b.",
			"Needs controlled stack content the size of the frame (~0xf8 bytes); tight buffers won't fit.",
		],
		tools: ["gdb", "pwn", "python3", "ROPgadget"],
	},
];
