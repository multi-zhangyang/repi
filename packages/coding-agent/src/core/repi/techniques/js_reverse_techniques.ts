/**
 * Technique catalog slice: js-reverse.
 */
import type { TechniqueEntry } from "./types.ts";

export const JS_REVERSE_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "js-signature-rebuild",
		name: "Client API signing scheme rebuild",
		domain: "js-reverse",
		mitre: ["T1550.001", "T1190"],
		cwe: ["CWE-327", "CWE-200"],
		triggers:
			"Web/app signs each request (HMAC/JWS/custom) in client JS; need to forge valid signed requests outside the app.",
		procedure: [
			"Locate the signing function: `grep -rE 'HMAC|signature|sign\\(|x-sign|timestamp'` in bundled JS; sourcemap if available.",
			"Deobfuscate: `webcrack`/`de4js`/manual; trace inputs — what feeds the signature (body, path, nonce, timestamp, secret).",
			"Recover the key: hardcoded in JS, or fetched at runtime (hook fetch/crypto.subtle with Frida-in-browser or a CDP snippet).",
			"Reimplement in Python: replicate canonicalization (field order, encoding, case), the exact HMAC/hash alg, nonce/timestamp window.",
			"Validate with controls: compare signed vs missing-signature vs tampered-signature on the same route; do not call 200/code=0 proof unless the negative controls fail or a browser-captured signature matches byte-for-byte.",
			"For permutation/table-based signing schemes, assert the table is a true permutation/no duplicates and pin the derived key to live asset IDs before replay.",
		],
		proofExit:
			"Independently-signed request accepted by the server while missing/tampered signatures fail, or the reproduced signature matches a browser-captured app signature byte-for-byte; ≥2 samples/routes.",
		pitfalls: [
			"Canonicalization details (field ordering, `&` vs `,`, base64url vs base64, include/exclude trailing `&`) break signatures — diff against a real app signature.",
			"Timestamp/nonce windows expire fast; clock-skew your forge to the server's window.",
			"Some public endpoints accept unsigned or bad signatures; this proves a policy gap, not a correct signer. Keep the negative-control matrix in the evidence block.",
			"Copied tables from stale posts can contain duplicate indices or wrong order; add a local assert that permutation tables cover every expected index exactly once.",
		],
		tools: ["node", "python3", "curl", "webcrack"],
	},
	{
		id: "js-wasm-reverse",
		name: "WebAssembly module reverse + decompile",
		domain: "js-reverse",
		mitre: ["T1027.002", "T1211"],
		cwe: ["CWE-693", "CWE-327"],
		triggers:
			"Critical logic (signing, license, anti-cheat, crypto) moved into a `.wasm` module; JS is a thin loader.",
		procedure: [
			"Acquire the wasm: pull from network (`-e 'http.response.body'` tshark) or `WebAssembly.Module.exports` reflection in devtools.",
			"Disassemble: `wabt wasm2wat` → WAT; `wasm-decompile` (wabt) for C-ish pseudocode; `ghidra` wasm plugin for full decompile.",
			"Map imports/exports — the JS↔wasm boundary shows which exported functions are the signing/license entry points.",
			"Trace: run in browser with `wasm-decompile` + breakpoints on exports, or `frida` to hook the wasm instance's exported functions and dump args/return.",
			"Recover constants/keys embedded in the module's data section; reimplement or call the module directly from your forge.",
		],
		proofExit:
			"Recovered the algorithm/key from the wasm AND reproduced its output (signature/license token) for ≥2 inputs matching the live module.",
		pitfalls: [
			"wasm is stack-machine + numeric — decompiler output is approximate; verify against dynamic traces.",
			"Some modules import JS funcs for crypto so the key isn't in wasm alone — hook the JS side too.",
		],
		tools: ["wabt", "ghidra", "node", "frida", "python3"],
	},
	{
		id: "js-sourcemap-secret-harvest",
		name: "JS source map and webpack chunk secret harvest",
		domain: "js-reverse",
		mitre: ["T1552", "T1083"],
		cwe: ["CWE-540", "CWE-312"],
		triggers: "SPA ships .js.map, exposed webpack:// sources, or predictable chunk URLs after build.",
		procedure: [
			"Collect main bundles and look for //# sourceMappingURL=; fetch sibling .map files.",
			"Parse maps for sourcesContent; grep for API keys, internal hosts, feature flags, hidden routes.",
			"If no maps: beautify + unminify webpack modules; recover router tables and signed request builders.",
			"Cross-check live API with recovered endpoints/signing code; prefer read-only probes first.",
			"Document recovered secrets as evidence with redaction; rotate if in-scope production.",
		],
		proofExit:
			"Recovered non-public source or secret that enables a new authenticated/signed request not visible in plain HTML; request transcript proves it.",
		pitfalls: [
			"Public marketing keys ≠ high impact — validate authorization impact.",
			"Huge maps — automate extraction, do not dump whole map into context.",
		],
		tools: ["httpx", "curl", "jq", "node", "rg"],
	},
	{
		id: "js-wasm-sidechannel",
		name: "WASM linear memory and side-channel recovery",
		domain: "js-reverse",
		mitre: ["T1059", "T1552"],
		cwe: ["CWE-208", "CWE-514"],
		triggers:
			"Browser/Node challenge ships WASM with crypto/compare in linear memory; JS glue only exposes thin wrappers.",
		procedure: [
			"Locate .wasm and instantiate; dump exports/imports via WebAssembly.Module.",
			"Hook memory.grow / memory exports; snapshot linear memory before/after sensitive calls.",
			"Diff memory for keys, nonces, intermediate digests; recover constant-time compare fail index if present.",
			"Rebuild pure JS/Python oracle from recovered tables; verify against known plaintext vectors.",
			"Document export names, memory offsets, and recovered constants as evidence.",
		],
		proofExit:
			"Recovered secret/table bytes that allow independent verification of a protected check without the original WASM path.",
		pitfalls: [
			"Shared memory races — freeze single-threaded replay.",
			"ASLR of wasm base is not process ASLR; offsets are module-relative.",
		],
		tools: ["node", "wasm-objdump", "python3", "browser"],
	},
];
