/** Technique catalog slice: crypto_stego late. */
import type { TechniqueEntry } from "./types.ts";

export const CRYPTO_STEGO_TECHNIQUES_LATE: readonly TechniqueEntry[] = [
	{
		id: "crypto-hash-length-extension",
		name: "Hash length-extension (MD5/SHA1/SHA256)",
		domain: "crypto-stego",
		mitre: ["T1190"],
		cwe: ["CWE-327", "CWE-347"],
		triggers:
			"Server computes `H(secret || message)` (secret prefix, no HMAC) and trusts the hash as a MAC for an attacker-extended message.",
		procedure: [
			"Note original message + hash (registers state), and compute the padding the original used.",
			"Resume the hash from the published state, append `&admin=true`, produce a valid hash for `message || padding || &admin=true`.",
			"Submit the extended message + forged hash without knowing the secret.",
			"Use `hashpumpy` / `hlextend`.",
		],
		proofExit:
			"Server accepts the forged hash for the extended message (privileged action), without the secret ever being known.",
		pitfalls: [
			"Only works for Merkle-Damgård hashes (MD5/SHA1/SHA2), NOT HMAC, NOT SHA3/BLAKE.",
			"Message length (hence padding) must be correct; off-by-one breaks it.",
		],
		tools: ["python3", "openssl"],
	},
	{
		id: "crypto-rsa-attacks",
		name: "RSA parameter attacks (low e, Wiener, Bleichenbacher, common modulus)",
		domain: "crypto-stego",
		mitre: ["T1190"],
		cwe: ["CWE-326", "CWE-327"],
		triggers:
			"Small public exponent (e=3) with short message, small private exponent d (Wiener), PKCS#1 v1.5 padding oracle (Bleichenbacher), shared modulus across keys.",
		procedure: [
			"Low e (e=3, m < n^(1/3)): cube-root the ciphertext to recover m.",
			"Wiener: if d < n^0.25, continued-fraction of e/n recovers d.",
			"Bleichenbacher/BB06: build an oracle from PKCS#1 v1.5 padding error distinctions; adaptively multiply ciphertext by s^e to recover plaintext byte-by-byte.",
			"Common modulus: same n, two e's with gcd(e1,e2)=1 → recover m via extended Euclid on the two ciphertexts.",
			"Use `RsaCtfTool` / Sage.",
		],
		proofExit:
			"Recovered plaintext is valid (sensible/contains flag) and the math checks (d re-derives the private key / m^e mod n == c).",
		pitfalls: [
			"OAEP padding defeats Bleichenbacher — confirm v1.5.",
			"Cube-root needs exact integer arithmetic; float loses precision.",
		],
		tools: ["python3", "sage", "openssl", "z3"],
	},
	{
		id: "crypto-ecdsa-nonce-reuse",
		name: "ECDSA / nonce-reuse / lattice (ECDSA secret-key recovery)",
		domain: "crypto-stego",
		mitre: ["T1190"],
		cwe: ["CWE-338", "CWE-347"],
		triggers:
			"Two ECDSA signatures share a nonce k (same r across messages), or k has biased bits (hidden number problem, lattice-reducible).",
		procedure: [
			"Detect repeated r across two signatures → same k → k = (z1-z2)/(r*(s1-s2)), then private key d = (s*k - z)/r.",
			"For biased/nonces: collect ~2^L signatures, build a Hidden Number Problem lattice, reduce with LLL/CKKS in Sage.",
			"Verify the recovered d reproduces all observed signatures.",
		],
		proofExit:
			"Recovered private key regenerates every published signature for the public key; demonstrated on ≥2 signatures.",
		pitfalls: [
			"Need the exact hash z used per signature (which digest, pre/post-hash) — wrong z breaks the math.",
			"LLL on insufficient samples won't reduce; need enough signatures relative to bias.",
		],
		tools: ["python3", "sage", "z3"],
	},
];
