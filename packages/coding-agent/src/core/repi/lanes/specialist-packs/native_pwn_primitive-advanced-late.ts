/** Pwn primitive advanced scaffolds: srop/one-gadget/seccomp. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsPwnPrimitiveAdvancedLate(ctx: SpecialistPackContext): void {
	ctx.add(
		"pwn-advanced-srop-ret2dlresolve-scaffold",
		`cat > /tmp/repi-pwn-srop-dlresolve.py <<'PY'
	#!/usr/bin/env python3
	import shutil, subprocess, sys
	BIN = sys.argv[1] if len(sys.argv) > 1 else ${ctx.targetPython}
	def run(argv):
	    try:
	        return subprocess.run(argv, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=10).stdout
	    except Exception as exc:
	        return type(exc).__name__ + ': ' + str(exc)
	print('[pwn-srop] ctx.target=' + BIN)
	if shutil.which('ROPgadget'):
	    out = run(['ROPgadget', '--binary', BIN, '--only', 'syscall|int|pop|ret'])
	else:
	    out = run(['objdump', '-d', BIN])
	for line in out.splitlines():
	    low = line.lower()
	    if 'syscall' in low or 'int 0x80' in low or 'sigreturn' in low:
	        print('[pwn-srop-gadget] ' + line[:220])
	try:
	    from pwn import ELF, ROP, SigreturnFrame, Ret2dlresolvePayload, ctx.context
	    ctx.context.log_level = 'error'
	    elf = ELF(BIN, checksec=False)
	    print('[pwn-srop] pwntools=true arch=' + str(elf.arch) + ' bits=' + str(elf.bits))
	    print('[pwn-srop] scaffold=SigreturnFrame(kernel=arch); set rax/rdi/rsi/rdx/rip for mprotect/read/execve')
	    print('[pwn-ret2dlresolve] scaffold=Ret2dlresolvePayload(elf, symbol="system", args=["/bin/sh"])')
	except Exception as exc:
	    print('[pwn-srop] pwntools=false reason=' + type(exc).__name__ + ':' + str(exc))
	PY
	chmod +x /tmp/repi-pwn-srop-dlresolve.py
	python3 /tmp/repi-pwn-srop-dlresolve.py ${ctx.targetArg}`,
		"SROP syscall surface and ret2dlresolve payload scaffold with pwntools/objdump fallback",
	);
	ctx.add(
		"pwn-advanced-one-gadget-constraints",
		`LIBC=$(ldd ${ctx.targetArg} 2>/dev/null | awk '/libc.so/{print $(NF-1); exit}')
	printf '[pwn-one-gadget] libc=%s\\n' "$LIBC"
	if [ -n "$LIBC" ] && [ -e "$LIBC" ]; then sha256sum "$LIBC" | sed 's/^/[pwn-one-gadget] sha256 /'; fi
	if [ -n "$LIBC" ] && command -v one_gadget >/dev/null 2>&1; then one_gadget --raw -l 1 "$LIBC" 2>/dev/null | tr ' ' '\\n' | sed 's/^/[pwn-one-gadget] candidate=/' | head -80; one_gadget "$LIBC" 2>/dev/null | sed -n '1,120p' | sed 's/^/[pwn-one-gadget-constraint] /'; else echo '[pwn-one-gadget] tool=missing constraints=check registers,stack,null-byte,envp,argv manually'; fi`,
		"one_gadget candidate and constraint review tied to resolved libc fingerprint",
	);
	ctx.add(
		"pwn-advanced-seccomp-sandbox-scaffold",
		`echo '[pwn-seccomp] ctx.target='${ctx.targetArg}
	checksec --file=${ctx.targetArg} 2>/dev/null | sed 's/^/[pwn-seccomp-checksec] /' || true
	strings -a ${ctx.targetArg} 2>/dev/null | grep -Ei 'seccomp|prctl|pledge|sandbox|filter|BPF|SECCOMP' | head -80 | sed 's/^/[pwn-seccomp-string] /' || true
	if command -v seccomp-tools >/dev/null 2>&1; then seccomp-tools dump ${ctx.targetArg} 2>/dev/null | sed -n '1,160p' | sed 's/^/[pwn-seccomp-dump] /' || true; else echo '[pwn-seccomp] seccomp-tools=missing fallback=strace'; fi
	if command -v strace >/dev/null 2>&1; then timeout 5 strace -f -e trace=prctl,seccomp,execve,openat,read,write ${ctx.targetArg} </dev/null 2>&1 | sed -n '1,160p' | sed 's/^/[pwn-sandbox-strace] /' || true; fi`,
		"seccomp/sandbox syscall filter triage with seccomp-tools and strace fallback",
	);
}
