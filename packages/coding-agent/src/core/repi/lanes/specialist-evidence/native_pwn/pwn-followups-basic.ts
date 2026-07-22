/** Pwn basic crash/offset/ROP/local verifier followups. */
import { shellQuote } from "../../../target.ts";
import type { PwnEvidenceMeta } from "./pwn-findings.ts";

type LaneCommand = any;

export function appendPwnBasicFollowups(meta: PwnEvidenceMeta): LaneCommand[] {
	const followups: LaneCommand[] = [];
	if (!meta.enabled) return followups;
	const {
		pack,
		targetArg,
		targetPython,
		crashLines,
		crashRegisterValues,
		resolvedOffsets,
		offsetLines,
		ropLibcLines,
		verifierLines,
	} = meta;
	if (pack.target && crashLines.length > 0) {
		followups.push({
			label: "pwn-cyclic-offset-helper",
			command: `python3 - <<'PY'\nimport os, pathlib\nneedle = os.getenv('REPI_CRASH_VALUE', '').lower().replace('0x','')\npat = pathlib.Path('/tmp/repi-cyclic.bin')\nif not needle or not pat.exists():\n    print('set REPI_CRASH_VALUE from RIP/EIP/register bytes and ensure /tmp/repi-cyclic.bin exists')\nelse:\n    data = pat.read_bytes()\n    raw = bytes.fromhex(needle)\n    for candidate in (raw, raw[::-1]):\n        off = data.find(candidate)\n        print('candidate', candidate.hex(), 'offset', off)\nPY`,
			evidence: "derive cyclic offset from crashed register/control bytes",
		});
		followups.push({
			label: "pwn-focused-gdb-rerun",
			command: `gdb -q ${targetArg} -ex 'set pagination off' -ex 'run < /tmp/repi-cyclic.bin' -ex 'info registers' -ex 'bt' -ex 'x/32gx $rsp' -ex 'quit'`,
			evidence: "repeat crash with register, stack, and backtrace evidence",
		});
	}
	if (pack.target && (crashRegisterValues.length > 0 || crashLines.length > 0 || offsetLines.length > 0)) {
		const crashEnv = crashRegisterValues[0] ? `REPI_CRASH_VALUE=${shellQuote(crashRegisterValues[0])} ` : "";
		followups.push({
			label: "pwn-offset-analyzer-rerun",
			command: `${crashEnv}python3 /tmp/repi-pwn-offset-analyzer.py 2>/dev/null || ${crashEnv}python3 - <<'PY'\nimport os, pathlib\nneedle=os.getenv('REPI_CRASH_VALUE','').lower().replace('0x','')\npat=pathlib.Path('/tmp/repi-cyclic.bin')\nif not needle or not pat.exists(): print('[pwn-offset] crash_value=<unset> offset=-1')\nelse:\n data=pat.read_bytes(); raw=bytes.fromhex(needle)\n for c in (raw, raw[::-1], raw[-4:], raw[-4:][::-1]):\n  off=data.find(c); print(f'[pwn-offset] crash_value=0x{needle} candidate={c.hex()} offset={off}')\nPY`,
			evidence: "rerun cyclic offset analyzer with parsed RIP/EIP/PC crash value",
		});
	}
	if (pack.target && (ropLibcLines.length > 0 || crashLines.length > 0)) {
		followups.push({
			label: "pwn-rop-libc-followup",
			command: `ldd ${targetArg} 2>/dev/null || true; (ROPgadget --binary ${targetArg} --only 'pop|ret|syscall' 2>/dev/null || ropper --file ${targetArg} --search 'pop rdi; ret' 2>/dev/null || true) | head -220`,
			evidence: "libc/loader fingerprint and focused ROP gadget follow-up",
		});
		followups.push({
			label: "pwn-rop-libc-scaffold-rerun",
			command: `[ -f /tmp/repi-pwn-rop-libc.py ] && python3 /tmp/repi-pwn-rop-libc.py ${targetArg} || true; ldd ${targetArg} 2>/dev/null || true; objdump -R ${targetArg} 2>/dev/null | grep -Ei 'puts|printf|read|write|system|__libc_start_main' | head -80 || true; (ROPgadget --binary ${targetArg} --only 'pop|ret|syscall' 2>/dev/null || ropper --file ${targetArg} --search 'pop rdi; ret' 2>/dev/null || true) | head -220`,
			evidence: "rebuild ROP/libc scaffold from PLT/GOT/gadget/libc anchors",
		});
	}
	if (pack.target && (resolvedOffsets.length > 0 || verifierLines.length > 0 || crashLines.length > 0)) {
		const offsetEnv = resolvedOffsets[0] !== undefined ? `REPI_OFFSET=${resolvedOffsets[0]} ` : "";
		followups.push({
			label: "pwn-local-verifier-rerun",
			command: `${offsetEnv}[ -f /tmp/repi-pwn-local-verifier.py ] && ${offsetEnv}python3 /tmp/repi-pwn-local-verifier.py ${targetArg} || printf '%s\n' 'rerun pwn-primitive-local-verifier to regenerate /tmp/repi-pwn-local-verifier.py'`,
			evidence: "rerun local payload smoke verifier with parsed cyclic offset when available",
		});
	}
	if (pack.target && (resolvedOffsets.length > 0 || ropLibcLines.length > 0)) {
		const offsetLiteral = resolvedOffsets[0] ?? 0;
		followups.push({
			label: "pwn-pwntools-exploit-template",
			command: `cat > /tmp/repi-exploit-template.py <<'PY'\nfrom pwn import *\nBIN = ${targetPython}\ncontext.binary = exe = ELF(BIN, checksec=False)\ncontext.log_level = 'debug'\nOFFSET = int(args.OFFSET or ${offsetLiteral})\nHOST, PORT = args.HOST or '127.0.0.1', int(args.PORT or 31337)\ndef start():\n    return remote(HOST, PORT) if args.REMOTE else process([BIN])\ndef flat_payload(chain):\n    return b'A' * OFFSET + flat(chain)\n# Patch gadgets/leak targets from pwn-rop-libc-scaffold-rerun output.\nio = start()\nlog.info('offset=%d', OFFSET)\nio.interactive()\nPY\nsed -n '1,240p' /tmp/repi-exploit-template.py`,
			evidence: "pwntools exploit template prefilled with parsed offset and ROP/libc patch points",
		});
	}
	if (pack.target && meta.seccompSandboxLines.length > 0) {
		followups.push({
			label: "pwn-seccomp-sandbox-rerun",
			command: `seccomp-tools dump ${targetArg} 2>/dev/null | sed -n '1,160p' || timeout 5 strace -f -e trace=prctl,seccomp,execve,openat,read,write ${targetArg} </dev/null 2>&1 | sed -n '1,160p' || true`,
			evidence: "rerun seccomp/sandbox syscall filter and strace triage",
		});
	}
	return followups;
}
