/** Technique catalog slice: native-reverse. */
import type { TechniqueEntry } from "./types.ts";

export const NATIVE_REVERSE_UNPACK_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "rev-vm-unpack",
		name: "Custom-VM / packed binary unpacking",
		domain: "native-reverse",
		mitre: ["T1027.002", "T1027.009", "T1211"],
		cwe: ["CWE-693"],
		triggers:
			"Binary is packed (UPX/VMProtect/Themida/custom), entropy high in .text, imports minimal, a stub decrypts/decompresses at runtime.",
		procedure: [
			"Identify packer: `file`, `strings -a` for UPX!, `yara` rules, entropy (`binwalk -E`), section names (.vmp0, .themida).",
			"UPX: `upx -d` on a COPY; if modified header, fix `p_paddr`/magic first.",
			"Runtime unpack: run under gdb, break at the OEP (catch the stub's `jmp`/`call` to decrypted code via memory-write watchpoint or `stop-on` write to the entry page).",
			"Dump with `gcore`/`process_vm_readv`/`memdump` after unpack; fix IAT with Scylla/rebuild imports.",
			"For VMProtect/Themida: devirtualize partially (identify handler dispatch, trace VM context) — accept that full devirt may be infeasible; fall back to dynamic analysis at API boundaries.",
		],
		proofExit:
			"Dumped binary runs standalone OR the unpacked code at OEP disassembles coherently (clean CFG, resolved imports); IAT rebuilt and verified.",
		pitfalls: [
			"Anti-debug (PEB BeingDebugged, `rdtsc` checks, hardware bp detection) — bypass via `ScyllaHide`/manual PEB patch before dumping.",
			"Stolen bytes / IAT destruction need reconstruction, not just a dump.",
			"VM-based protection may never cleanly devirtualize — pivot to API-level dynamic tracing.",
		],
		tools: ["gdb", "radare2", "binwalk", "yara", "upx", "python3"],
	},
	{
		id: "rev-anti-debug-bypass",
		name: "Anti-debug / anti-VM evasion bypass",
		domain: "native-reverse",
		mitre: ["T1497.001", "T1211"],
		cwe: ["CWE-693"],
		triggers:
			"Binary exits/crashes under gdb or in a VM but runs bare-metal; checks `ptrace(PTRACE_TRACEME)`, PEB flags, `rdtsc` deltas, hardware, timing, MAC/serial.",
		procedure: [
			"Static scan for checks: `objdump -d | grep -E 'ptrace|int.*0x80|rdtsc|BeingDebugged|IsDebuggerPresent'`, strings for VM artifacts (`VBox`, `QEMU`, `Sbie`).",
			"Bypass ptrace self-trace: hook `ptrace` to return 1, or run the binary and attach AFTER the check, or `LD_PRELOAD` a stub.",
			"Patch PEB BeingDebugged: gdb `set *(int*)($peb+0x2)=0`, or ScyllaHide.",
			"Timing: hook `rdtsc`/`clock_gettime` to return constant deltas.",
			"VM: spoof MAC (OUI), patch `CPUID` hypervisor bit, hide artifacts via registry/`/sys` patching.",
		],
		proofExit:
			"Binary progresses past the check under the debugger/VM and reaches the protected logic (demonstrated before/after patch).",
		pitfalls: [
			"Checks are often redundant/layered — patch one, another fires; enumerate ALL.",
			"Some checks call `exit` via indirect pointers; set bp on the termination, not the check.",
		],
		tools: ["gdb", "radare2", "frida", "python3", "objdump"],
	},
	{
		id: "rev-deobfuscate-ollvm",
		name: "OLLVM control-flow flattening / bogus-flow deobfuscation",
		domain: "native-reverse",
		mitre: ["T1027.002", "T1211"],
		cwe: ["CWE-693"],
		triggers:
			"Function body is a single dispatcher switch with a state variable driving real blocks (CFF); opaque predicates / bogus branches inflate CFG.",
		procedure: [
			"Identify the dispatcher: a state var `v`, a switch/`cmp+jmp` tree, and `v = next_state` writes at each block end.",
			"Symbolic execution per block: for each block compute the next state constant (often constant-foldable); build the real CFG (`angr`/`Triton`/`D810`/`dropflat`).",
			"Remove opaque predicates: SMT-prove branches always true/false (`z3`/angr claripy) and fold them.",
			"Reconstruct readable pseudocode from the unflattened CFG.",
		],
		proofExit:
			"Unflattened CFG matches a sensible control flow; reconstructed logic produces correct I/O on test inputs.",
		pitfalls: [
			"State computed from memory/inputs (not constant) breaks static reconstruction — needs dynamic trace anchoring.",
			"Bogus flows with real side effects aren't purely removable — verify each branch is effect-free before deleting.",
		],
		tools: ["radare2", "angr", "z3", "python3", "ghidra"],
	},
];
