/** Technique catalog slice: crypto_stego early. */
import type { TechniqueEntry } from "./types.ts";

export const CRYPTO_STEGO_TECHNIQUES_EARLY: readonly TechniqueEntry[] = [
	{
		id: "crypto-known-plaintext-xor-keystream",
		name: "Known-plaintext XOR/keystream recovery",
		domain: "crypto-stego",
		mitre: ["T1552", "T1040"],
		cwe: ["CWE-329", "CWE-327"],
		triggers:
			"Repeating XOR, RC4 without proper nonce, or custom stream cipher where a known plaintext header/magic is available in ciphertext.",
		procedure: [
			"Collect ciphertext samples with known headers (PNG/ZIP/ELF/`HTTP/1`/JSON keys) or fixed IV reuse pairs.",
			"Recover keystream: C ⊕ P_known → S; slide across candidates to maximize printable/high-entropy structure.",
			"If multi-message same keystream: C1 ⊕ C2 = P1 ⊕ P2; crib-drag common words/paths.",
			"Validate by decrypting remaining bytes and checking file magic/JSON parse.",
			"Automate with python + histogram/chi-square; never claim success without re-encryption round-trip.",
			"Bridge: specialist crypto lane + `re_domain_proof_exit show crypto` after artifact write.",
		],
		proofExit:
			"Recovered keystream/key decrypts ≥1 independent sample to valid structure (magic/parse) with script+hashes saved.",
		pitfalls: [
			"Single short sample can fit many keys — require second sample or structural validation.",
			"Nonce reuse in modern AEAD is different from pure XOR; identify mode first.",
		],
		tools: ["python3", "xxd", "file", "rg", "cyberchef"],
	},
	{
		id: "crypto-padding-oracle",
		name: "CBC padding oracle (PKCS#7)",
		domain: "crypto-stego",
		mitre: ["T1190"],
		cwe: ["CWE-327", "CWE-209"],
		triggers:
			"App decrypts CBC ciphertext and distinguishes padding error from other errors (different status, timing, error message, or blind via oracle script).",
		procedure: [
			"Confirm the oracle: flip the last byte of the second-to-last block; observe padding-accepted vs rejected (403/500/redirect/success).",
			"Decrypt byte-by-byte: for each ciphertext position, brute the IV/prev-block byte until padding valid → recover plaintext XOR.",
			"Encrypt arbitrary plaintext: build blocks backwards forging the prior block to produce the desired plaintext.",
			"Use `padding-oracle` tooling / pwntools-style loop; instrument the oracle response carefully.",
		],
		proofExit:
			'Recovered plaintext matches a known prefix (e.g. `{"admin":false}`) AND a forged ciphertext decrypts to your chosen plaintext, captured.',
		pitfalls: [
			"A 200/200 oracle (no distinction) is not a padding oracle — need a distinguishable response.",
			"Some servers normalize errors (constant-time); fall back to timing if status is uniform.",
			"Last-block padding edge cases need the full two-block handling.",
		],
		tools: ["python3", "openssl", "curl"],
	},
	{
		id: "crypto-cbc-bitflip",
		name: "CBC bit-flipping (controlled plaintext mutation)",
		domain: "crypto-stego",
		mitre: ["T1190"],
		cwe: ["CWE-327"],
		triggers:
			"Plaintext is structured and reflected (e.g. `role=user;admin=false`), CBC mode, server decrypts and acts on a field you can't directly set.",
		procedure: [
			"Locate the target byte offset in the plaintext block.",
			"Flip the corresponding byte in the PREVIOUS ciphertext block — that flips the same offset in the current plaintext block.",
			"Accept that the previous block's plaintext becomes garbage; ensure that block isn't parsed for the auth decision (or place target in block 1 flipping IV).",
			"For block 1, flip IV bytes (you often control IV in a cookie).",
		],
		proofExit:
			"Forged ciphertext decrypts to `admin=true` (or equivalent) and the server grants the privileged action; captured request+response.",
		pitfalls: [
			"Flipping a byte corrupts the prior block — if that block holds a MAC/checksum, the forgery is rejected.",
			"Authenticated encryption (GCM/EAX) defeats this entirely — confirm CBC first.",
		],
		tools: ["python3", "openssl", "curl"],
	},
];
