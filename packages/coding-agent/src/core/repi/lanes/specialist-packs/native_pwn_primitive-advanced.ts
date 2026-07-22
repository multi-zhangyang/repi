/** Pwn primitive advanced scaffolds: heap/fmt/srop/one-gadget/seccomp + reverse next. */

import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { applyWantsPwnPrimitiveAdvancedLate } from "./native_pwn_primitive-advanced-late.ts";
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsPwnPrimitiveAdvanced(ctx: SpecialistPackContext): void {
	ctx.add(
		"pwn-advanced-heap-tcache-scaffold",
		`cat > /tmp/repi-pwn-heap-tcache.gdb <<'GDB'
	set pagination off
	set confirm off
	break malloc
	break free
	run
	info registers
	backtrace
	info proc mappings
	python
	print('[pwn-heap] gdb_python_ready=true')
	end
	heap bins
	tcachebins
	fastbins
	unsortedbin
	quit
	GDB
	if command -v gdb >/dev/null 2>&1; then (gdb -q ${ctx.targetArg} -x /tmp/repi-pwn-heap-tcache.gdb || true) 2>&1 | tee /tmp/repi-pwn-heap-tcache.log | sed -n '1,220p'; else echo '[pwn-heap] gdb=missing ctx.target='${ctx.targetArg}; fi
	printf '%s\\n' '[pwn-tcache] artifact=/tmp/repi-pwn-heap-tcache.log anchors=malloc,free,tcachebins,fastbins,unsortedbin'`,
		"heap/tcache bin state probe for allocator primitive classification",
	);
	ctx.add(
		"pwn-advanced-format-string-scaffold",
		`cat > /tmp/repi-pwn-fmtstr.py <<'PY'
	#!/usr/bin/env python3
	import os, subprocess, sys
	BIN = sys.argv[1] if len(sys.argv) > 1 else ${ctx.targetPython}
	probes = [b'%p.' * 12, b'%lx.' * 12, b'AAAA%7$pBBBB', b'%s', b'%n']
	timeout = float(os.getenv('REPI_FMT_TIMEOUT', '2'))
	print('[pwn-fmtstr] ctx.target=' + BIN + ' probes=' + str(len(probes)))
	for idx, payload in enumerate(probes, 1):
	    try:
	        proc = subprocess.run([BIN], input=payload + b'\\n', stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=timeout)
	        out = (proc.stdout + b'\\n' + proc.stderr)[:240].decode('utf-8', 'replace').replace('\\n', '\\\\n')
	        print('[pwn-fmtstr-probe] idx=' + str(idx) + ' exit=' + str(proc.returncode) + ' payload=' + payload.decode('latin1', 'replace') + ' output=' + out)
	    except Exception as exc:
	        print('[pwn-fmtstr-probe] idx=' + str(idx) + ' error=' + type(exc).__name__ + ':' + str(exc))
	try:
	    from pwn import FmtStr, fmtstr_payload
	    print('[pwn-fmtstr] pwntools_fmtstr=true helper=FmtStr,fmtstr_payload')
	    print('[pwn-fmtstr] scaffold=fmtstr_payload(offset, {write_addr: value}, write_size=short)')
	except Exception as exc:
	    print('[pwn-fmtstr] pwntools_fmtstr=false reason=' + type(exc).__name__ + ':' + str(exc))
	PY
	chmod +x /tmp/repi-pwn-fmtstr.py
	python3 /tmp/repi-pwn-fmtstr.py ${ctx.targetArg}`,
		"format-string leak/write probe and pwntools fmtstr_payload scaffold",
	);
	applyWantsPwnPrimitiveAdvancedLate(ctx);

	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `pwn primitive ${ctx.targetArg ?? ""} advanced reverse`,
		target: ctx.targetArg,
		includeGates: true,
	}).slice(0, 2);
	for (const command of reverseNext) {
		ctx.add("pwn-primitive-reverse-domain-next", command, "reverse domain capture next");
	}
}
