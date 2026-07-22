/** Crypto/stego pack: bridge + discovery/inventory. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsCryptoStegoBasic(ctx: SpecialistPackContext): void {
	ctx.specialists.push("crypto/stego solver");
	ctx.add(
		"crypto-runtime-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_runtime_adapter run ${ctx.targetArg}" "re_js_signing run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[crypto-runtime-repi-bridge] target_missing\n'",
		"bridge crypto/stego analysis to reverse runtime capture gates",
	);
	if (!ctx.target) {
		ctx.add(
			"crypto-stego-ctx.target-discovery",
			"find . -maxdepth 5 -type f \\( -iname '*.txt' -o -iname '*.enc' -o -iname '*.bin' -o -iname '*.png' -o -iname '*.jpg' -o -iname '*.wav' -o -iname '*.pcap' -o -iname '*cipher*' -o -iname '*crypto*' -o -iname '*stego*' \\) -print | head -160",
			"discover crypto/stego candidate artifacts",
		);
	}
	ctx.add(
		"crypto-stego-parameter-inventory-scaffold",
		`cat > /tmp/repi-crypto-inventory.py <<'PY'
	#!/usr/bin/env python3
	import base64, binascii, hashlib, json, math, pathlib, re, sys
	ctx.target = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ${ctx.targetPython})
	blob = b''
	if ctx.target.exists() and ctx.target.is_file():
	    blob = ctx.target.read_bytes()[:8_000_000]
	else:
	    blob = str(ctx.target).encode()
	text = blob.decode('utf-8', 'ignore')
	wide = blob.decode('utf-16le', 'ignore')
	corpus = text + '\\n' + wide
	print('[crypto-param]', 'ctx.target=' + str(ctx.target), 'bytes=' + str(len(blob)), 'sha256=' + hashlib.sha256(blob).hexdigest() if blob else 'sha256=none')
	patterns = {
	  'hex': r'\\b[0-9a-fA-F]{16,}\\b',
	  'base64': r'\\b[A-Za-z0-9+/]{24,}={0,2}\\b',
	  'int': r'\\b\\d{8,}\\b',
	  'pem': r'-----BEGIN [A-Z ]+-----[\\s\\S]{0,2000}?-----END [A-Z ]+-----',
	  'url_param': r'\\b(?:iv|nonce|salt|key|sig|signature|token|ct|cipher|modulus|n|e|p|q)=([^\\s&]+)',
	}
	for name, pat in patterns.items():
	    vals = []
	    for m in re.findall(pat, corpus, re.I):
	        value = m if isinstance(m, str) else m[0]
	        if value not in vals: vals.append(value)
	        if len(vals) >= 24: break
	    print('[crypto-param]', 'type=' + name, 'count=' + str(len(vals)), 'samples=' + '|'.join(v[:80] for v in vals[:6]))
	ints = [int(x) for x in re.findall(r'\\b\\d{8,}\\b', corpus)[:40]]
	for i, n in enumerate(ints[:12]):
	    bits = n.bit_length()
	    if bits >= 64:
	        print('[crypto-param]', 'integer_index=' + str(i), 'bits=' + str(bits), 'mod8=' + str(n % 8), 'hex_head=' + hex(n)[:40])
	print('[crypto-param]', 'next=build transform replay, oracle model, and known-answer test')
	PY
	chmod +x /tmp/repi-crypto-inventory.py
	python3 /tmp/repi-crypto-inventory.py ${ctx.targetArg}`,
		"crypto parameter derivation inventory: hashes, encodings, large integers, PEM, IV/nonce/key/signature fields",
	);
}
