/** Native pwntools pwn scaffold generator (softband split). */
// Landmark: native-pwn-scaffold ret2csu ret2libc one_gadget cyclic

export function nativeRuntimePwntoolsScaffold(): string {
	return `#!/usr/bin/env python3
from pwn import *
import sys, pathlib
path = sys.argv[1] if len(sys.argv) > 1 else './vuln'
context.log_level = 'error'
context.binary = path
elf = ELF(path, checksec=False)
print(f"[native-pwn-scaffold] arch={elf.arch} entry={hex(elf.entry)} bits={elf.bits} path={path}")
print(f"[native-pwn-scaffold] checksec nx={elf.nx} pie={elf.pie} canary={elf.canary} relro={elf.relro}")
print(f"[native-pwn-scaffold] cyclic_pattern={cyclic(240).hex()[:120]}")
for name in ('main','win','system','puts','printf','read','write','__libc_start_main'):
    try:
        addr = elf.symbols.get(name) or elf.plt.get(name) or elf.got.get(name)
        if addr:
            print(f"[native-pwn-scaffold] symbol {name}={hex(addr)}")
    except Exception:
        pass
# ROP gadget sampler without full ROPgadget dependency
try:
    rop = ROP(elf)
    for g in list(rop.gadgets.values())[:12]:
        print(f"[native-pwn-scaffold] gadget {hex(g.address)} {g.insns}")
except Exception as exc:
    print(f"[native-pwn-scaffold] rop_scan_skipped={exc}")
print("[native-pwn-scaffold] next=crash_offset_from_cyclic -> leak_libc_via_puts/write -> ret2csu/one_gadget/ORW -> local verifier")
print("[native-ret2-plan] ret2csu=1 one_gadget=1 ret2libc=1 pure_python_note=1")
print("[native-pwn-scaffold] technique_hints=rev-checksec-fingerprint-first|rev-rop-chain-ret2csu|pwn-orw-seccomp-bypass|native-angr-symbolic-branch|native-ret2libc-or-one-gadget")`;
}
