/** Crypto/stego pack: transform/solver/extraction + reverse next. */

import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsCryptoStegoAdvanced(ctx: SpecialistPackContext): void {
	ctx.add(
		"crypto-stego-transform-replay-scaffold",
		`cat > /tmp/repi-crypto-transform.py <<'PY'
	#!/usr/bin/env python3
	import base64, binascii, gzip, hashlib, pathlib, re, sys, zlib
	ctx.target = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ${ctx.targetPython})
	data = ctx.target.read_bytes()[:4_000_000] if ctx.target.exists() and ctx.target.is_file() else str(ctx.target).encode()
	text = data.decode('utf-8', 'ignore')
	print('[crypto-transform]', 'ctx.target=' + str(ctx.target), 'bytes=' + str(len(data)), 'sha256=' + hashlib.sha256(data).hexdigest())
	candidates = []
	for label, raw in [('file', data), *[(f'b64:{i}', m.encode()) for i,m in enumerate(re.findall(r'[A-Za-z0-9+/]{24,}={0,2}', text)[:12])], *[(f'hex:{i}', m.encode()) for i,m in enumerate(re.findall(r'\\b[0-9a-fA-F]{16,}\\b', text)[:12])]]:
	    queue = [(label, raw)]
	    seen = set()
	    for depth in range(3):
	        nextq = []
	        for name, blob in queue:
	            key = (name, hashlib.sha256(blob[:4096]).hexdigest())
	            if key in seen: continue
	            seen.add(key)
	            sample = blob[:120].decode('utf-8', 'ignore').replace('\\n',' ')
	            printable = sum(32 <= b < 127 for b in blob[:200])
	            print('[crypto-transform]', 'chain=' + name, 'len=' + str(len(blob)), 'printable=' + str(printable), 'sample=' + sample[:120])
	            transforms = []
	            try: transforms.append(('base64', base64.b64decode(blob + b'=' * (-len(blob) % 4), validate=False)))
	            except Exception: pass
	            try: transforms.append(('hex', binascii.unhexlify(re.sub(rb'[^0-9a-fA-F]', b'', blob))))
	            except Exception: pass
	            try: transforms.append(('gzip', gzip.decompress(blob)))
	            except Exception: pass
	            try: transforms.append(('zlib', zlib.decompress(blob)))
	            except Exception: pass
	            for tname, out in transforms:
	                if out and len(out) != len(blob):
	                    nextq.append((name + '->' + tname, out[:4_000_000]))
	        queue = nextq[:20]
	PY
	chmod +x /tmp/repi-crypto-transform.py
	python3 /tmp/repi-crypto-transform.py ${ctx.targetArg}`,
		"transform replay scaffold for base64/hex/gzip/zlib chains with reproducible samples and hashes",
	);
	ctx.add(
		"crypto-stego-solver-known-answer-scaffold",
		`cat > /tmp/repi-crypto-solver.py <<'PY'
	#!/usr/bin/env python3
	import hashlib, json, os, pathlib, re, subprocess, sys
	ctx.target = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ${ctx.targetPython})
	print('[crypto-solver]', 'ctx.target=' + str(ctx.target))
	try:
	    import z3  # type: ignore
	    x = z3.BitVec('x', 32)
	    s = z3.Solver(); s.add(((x ^ 0x1337) + 0x42) & 0xffffffff == 0x41424344)
	    print('[crypto-solver]', 'z3=present', 'toy_check=' + str(s.check()))
	except Exception as exc:
	    print('[crypto-solver]', 'z3=missing_or_failed', type(exc).__name__ + ':' + str(exc)[:120])
	try:
	    import Crypto.Cipher.AES  # type: ignore
	    print('[crypto-solver]', 'pycryptodome=present')
	except Exception as exc:
	    print('[crypto-solver]', 'pycryptodome=missing_or_failed', type(exc).__name__)
	known = os.getenv('REPI_KNOWN_ANSWER')
	candidate = os.getenv('REPI_CANDIDATE')
	if known is not None and candidate is not None:
	    ok = known == candidate or hashlib.sha256(candidate.encode()).hexdigest() == known
	    print('[crypto-known-answer]', 'verification=' + ('pass' if ok else 'fail'), 'known_len=' + str(len(known)), 'candidate_sha256=' + hashlib.sha256(candidate.encode()).hexdigest())
	else:
	    print('[crypto-known-answer]', 'mode=scaffold', 'set=REPI_KNOWN_ANSWER and REPI_CANDIDATE after solver step')
	print('[crypto-solver]', 'next=write solve.py with parameter derivation and assert known-answer test')
	PY
	chmod +x /tmp/repi-crypto-solver.py
	python3 /tmp/repi-crypto-solver.py ${ctx.targetArg}`,
		"solver script and known-answer test scaffold with Z3/PyCryptodome detection and verification marker",
	);
	ctx.add(
		"crypto-stego-extraction-scaffold",
		`file ${ctx.targetArg} 2>/dev/null || true
	exiftool ${ctx.targetArg} 2>/dev/null | head -120 || true
	zsteg ${ctx.targetArg} 2>/dev/null | head -160 || true
	binwalk ${ctx.targetArg} 2>/dev/null | head -120 || true
	strings -a -n 4 ${ctx.targetArg} 2>/dev/null | grep -Ei 'flag|ctf|key|iv|nonce|salt|cipher|base64|BEGIN|RSA|AES|xor|password|secret' | head -220`,
		"stego/file metadata extraction scaffold with exiftool/zsteg/binwalk/strings fallbacks",
	);

	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `crypto_stego ${ctx.targetArg ?? ""} reverse`,
		target: ctx.targetArg,
		includeGates: true,
	}).slice(0, 2);
	for (const command of reverseNext) {
		ctx.add("crypto-stego-reverse-domain-next", command, "reverse domain capture next");
	}
}
