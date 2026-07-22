import { packHasSpecialistSignal } from "../helpers.ts";
import type { SelfHealCtx } from "./ctx.ts";

export function appendPwnHeals(ctx: SelfHealCtx): void {
	const {
		pack,
		result: _result,
		findings: _findings,
		deficits: _deficits,
		route,
		combined: _combined,
		target,
		add,
		toolNames: _toolNames,
	} = ctx;
	if (/pwn|exploit/.test(route) || packHasSpecialistSignal(pack, /pwn-primitive|pwn primitive/i)) {
		add(
			"heal-pwn-primitive-crash",
			target
				? `python3 - <<'PY'\nimport pathlib\npathlib.Path('/tmp/repi-crash.bin').write_bytes(b'A'*512)\nprint('/tmp/repi-crash.bin')\nPY\ngdb -q ${target} -ex 'set pagination off' -ex 'run < /tmp/repi-crash.bin' -ex 'info registers' -ex 'bt' -ex 'x/24gx $rsp' -ex 'quit' 2>/dev/null || ${target} < /tmp/repi-crash.bin 2>&1 | head -160 || true`
				: 'find . -maxdepth 4 -type f -exec sh -c \'file "$1" | grep -q ELF && printf "%s\\n" "$1"\' _ {} \\; | head -80',
			"specialist pwn primitive crash/control fallback",
		);
		add(
			"heal-pwn-offset-analyzer",
			target
				? `[ -f /tmp/repi-pwn-offset-analyzer.py ] && python3 /tmp/repi-pwn-offset-analyzer.py || python3 - <<'PY'\nimport os, pathlib\nneedle=os.getenv('REPI_CRASH_VALUE','').lower().replace('0x','')\npat=pathlib.Path('/tmp/repi-cyclic.bin')\nif not needle or not pat.exists(): print('[pwn-offset] crash_value=<unset> offset=-1 note=rerun cyclic crash or set REPI_CRASH_VALUE')\nelse:\n data=pat.read_bytes(); raw=bytes.fromhex(needle)\n for c in (raw, raw[::-1], raw[-4:], raw[-4:][::-1]): print(f'[pwn-offset] crash_value=0x{needle} candidate={c.hex()} offset={data.find(c)}')\nPY`
				: 'printf "%s\n" "bind a concrete ELF target before pwn offset analyzer heal"',
			"specialist pwn cyclic offset analyzer fallback",
		);
		add(
			"heal-pwn-local-verifier",
			target
				? `[ -f /tmp/repi-pwn-local-verifier.py ] && python3 /tmp/repi-pwn-local-verifier.py ${target} || printf '%s\n' 'rerun pwn-primitive-local-verifier to regenerate local verifier scaffold'`
				: 'printf "%s\n" "bind a concrete ELF target before local payload verifier heal"',
			"specialist pwn local verifier fallback",
		);
		add(
			"heal-pwn-heap-tcache",
			target
				? `[ -f /tmp/repi-pwn-heap-tcache.gdb ] && gdb -q ${target} -x /tmp/repi-pwn-heap-tcache.gdb || printf '%s\\n' 'rerun pwn-advanced-heap-tcache-scaffold to regenerate heap/tcache probe'`
				: 'printf "%s\n" "bind a concrete ELF target before heap/tcache heal"',
			"specialist pwn heap/tcache allocator fallback",
		);
		add(
			"heal-pwn-format-string",
			target
				? `[ -f /tmp/repi-pwn-fmtstr.py ] && python3 /tmp/repi-pwn-fmtstr.py ${target} || printf '%s\\n' 'rerun pwn-advanced-format-string-scaffold to regenerate fmtstr probe'`
				: 'printf "%s\n" "bind a concrete ELF target before format-string heal"',
			"specialist pwn format-string probe fallback",
		);
		add(
			"heal-pwn-srop-ret2dlresolve",
			target
				? `[ -f /tmp/repi-pwn-srop-dlresolve.py ] && python3 /tmp/repi-pwn-srop-dlresolve.py ${target} || (ROPgadget --binary ${target} --only 'syscall|int|pop|ret' 2>/dev/null || objdump -d ${target} | grep -Ei 'syscall|int 0x80|sigreturn' | head -160)`
				: 'printf "%s\n" "bind a concrete ELF target before SROP/ret2dlresolve heal"',
			"specialist pwn SROP/ret2dlresolve fallback",
		);
		add(
			"heal-pwn-one-gadget-constraints",
			target
				? `LIBC=$(ldd ${target} 2>/dev/null | awk '/libc.so/{print $(NF-1); exit}'); [ -n "$LIBC" ] && one_gadget "$LIBC" 2>/dev/null | sed -n '1,160p' || printf '%s\\n' 'install one_gadget or inspect constraints manually from libc fingerprint'`
				: 'printf "%s\n" "bind a concrete ELF target before one_gadget heal"',
			"specialist pwn one_gadget constraint fallback",
		);
		add(
			"heal-pwn-seccomp-sandbox",
			target
				? `seccomp-tools dump ${target} 2>/dev/null | sed -n '1,160p' || timeout 5 strace -f -e trace=prctl,seccomp,execve,openat,read,write ${target} </dev/null 2>&1 | sed -n '1,160p' || true`
				: 'printf "%s\n" "bind a concrete ELF target before seccomp/sandbox heal"',
			"specialist pwn seccomp/sandbox fallback",
		);
	}
}
