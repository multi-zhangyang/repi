/** Technique catalog slice: pwn heap. */
import type { TechniqueEntry } from "./types.ts";

export const PWN_HEAP_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "pwn-tcache-poisoning",
		name: "glibc tcache poisoning (free-list corruption)",
		domain: "pwn",
		mitre: ["T1055", "T1068"],
		cwe: ["CWE-416", "CWE-122"],
		triggers:
			"glibc >= 2.26 (tcache present), a heap UAF or double-free on a chunk that lands in a tcache bin, and an allocation whose contents you control that is later used as a pointer (fd/next pointer).",
		procedure: [
			"Confirm libc version: `strings -a libc.so | grep 'GLIBC_2.'` or read `__libc_version` via gdb; tcache exists 2.26–2.33 (safe-linking from 2.32).",
			"Prove the UAF/double-free: trigger the free path twice or free-then-read; in gdb watch the tcache bin head via `pwndbg> heap` / `bins`.",
			"If safe-linking (>=2.32): recover the heap base first (leak a heap pointer), then XOR the target fd with (addr>>12) to forge the next pointer.",
			"Overwrite the freed chunk's fd with the address of your target (e.g. `__free_hook`, `stdout` `_IO_FILE`, a stack return address, or a GOT entry pre-2.34).",
			"Consume tcache entries until the allocation returns your target address; write a controlled value there.",
			"Trigger the target's use (call free on a controlled string → `__free_hook`; or corrupt `_IO_FILE` vtable for FILE-oriented attack on 2.34+ where hooks are gone).",
		],
		proofExit:
			"Local PoC spawns an interactive shell / reads flag ≥3 consecutive runs with the SAME libc, with captured `id`/`cat flag` output and the gadget chain logged. Remote stability proven separately (see exploit-reliability).",
		pitfalls: [
			"glibc 2.34 removed `__malloc_hook`/`__free_hook` — do not plan around them on modern libc; use FILE/IO_FILE or `_rtld_global`/exit handlers.",
			"tcache count must be >0 and the bin not empty or the allocation won't follow your forged pointer.",
			"safe-linking silently breaks naive fd overwrites on 2.32+; forgetting the XOR yields a crash, not a miss.",
		],
		tools: ["gdb", "pwn", "python3", "checksec", "readelf", "objdump"],
	},
	{
		id: "pwn-house-of-botcake",
		name: "House of Botcake (overlapping chunk via unsorted + tcache)",
		domain: "pwn",
		mitre: ["T1055", "T1068"],
		cwe: ["CWE-416", "CWE-122"],
		triggers:
			"glibc 2.26–2.33, you control a double-free between the tcache and the unsorted bin (free order flexibility), target has no direct UAF but a double-free primitive.",
		procedure: [
			"Fill the tcache bin for the target size (7 frees) so subsequent frees go to the unsorted bin.",
			"Free chunk A into unsorted, then free chunk B (overlaps A) — A and B now both appear, creating an overlap.",
			"Claim one tcache entry back, then free A again: A is now in BOTH the tcache and the unsorted list (the overlap).",
			"Allocate from unsorted to get a chunk overlapping the still-tcached chunk; overwrite the tcached chunk's fd with your target.",
			"Drain tcache to allocate at the forged address.",
		],
		proofExit:
			"Overlap demonstrated in gdb (`heap`/`vis_heap_chunks` shows the double-linked chunk) + arbitrary write landed + PoC shell ≥3/3 local runs.",
		pitfalls: [
			"Requires precise free order; off-by-one in the count breaks the unsorted/tcache routing.",
			"On 2.32+ combine with safe-linking recovery (leak heap base, XOR fd).",
		],
		tools: ["gdb", "pwn", "python3", "checksec"],
	},
];
