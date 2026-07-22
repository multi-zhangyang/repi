/**
 * Technique catalog slice: mobile.
 */
import type { TechniqueEntry } from "./types.ts";

export const MOBILE_TECHNIQUES: readonly TechniqueEntry[] = [
	{
		id: "mobile-apk-triage-frida-bridge",
		name: "APK triage fingerprint before Frida hooks",
		domain: "mobile",
		mitre: ["T1418", "T1426"],
		cwe: ["CWE-919"],
		triggers:
			"APK/XAPK target; need package/activity/sdk, native .so map, and hook surface before deep SSL/crypto bypass.",
		procedure: [
			"`file`/`sha256sum`/`aapt dump badging` for package, activities, sdkVersion.",
			"`aapt dump permissions` + manifest xmltree for exported components.",
			"`unzip -l` native libs; extract first .so and `readelf -d`/`file`.",
			"jadx keyword map for crypto/root/frida/okhttp sinks; do not full-decompile blindly.",
			"Device: `adb devices` + `frida-ps -Uai`; load SSL unpin / crypto hook only after package confirmed.",
			"Bridge: `re_mobile_runtime plan/run` + specialist android packs + `re_domain_proof_exit show mobile`.",
		],
		proofExit:
			"[android-apk]/package metadata + native lib list + at least one Frida attach/hook log or explicit device-missing blocker.",
		pitfalls: [
			"Hooking without package/ABI confirmation wastes device sessions.",
			"Multi-arch APKs need matching frida-server ABI.",
		],
		tools: ["aapt", "jadx", "apktool", "adb", "frida", "unzip", "readelf", "file"],
	},
	{
		id: "mobile-ssl-pinning-bypass",
		name: "SSL/TLS pinning bypass (Frida)",
		domain: "mobile",
		mitre: ["T1211", "T1550.001"],
		cwe: ["CWE-295"],
		triggers:
			"App pins server certs (OkHttp CertificatePinner, TrustKit, native OpenSSL/X509) and rejects your MITM proxy's cert.",
		procedure: [
			"Root/jailbreak the device or use an instrumented test build; attach Frida (`frida -U -f <pkg> -l unpin.js`).",
			"Universal unpin: `frida-tools` `bypass` scripts hook `SSLContext`, `OkHttp` `CertificatePinner.check`, `X509TrustManagerExtensions`, native `SSL_CTX_set_custom_verify`/`SSL_set_verify`.",
			"Confirm TLS through Burp/mitmproxy; capture the previously-hidden API traffic.",
			"For native pinning (Flutter/BoringSSL): hook `ssl_verify_cert_chain` or patch the `handshake` return; Flutter uses its own engine — `reFlutter` or hook `ssl_crypto_x509_session_verify_cert_chain`.",
		],
		proofExit:
			"MITM proxy decrypts the pinned host's traffic (captured request/response), app functions normally through the proxy.",
		pitfalls: [
			"Root detection may kill the app — bypass root checks first (see mobile-root-bypass).",
			"Flutter/React Native bundle their own TLS — generic Java hooks miss them; target the engine.",
		],
		tools: ["frida", "objection", "burpsuite", "mitmproxy", "adb"],
	},
	{
		id: "mobile-root-bypass",
		name: "Root / jailbreak detection bypass",
		domain: "mobile",
		mitre: ["T1211", "T1497.001"],
		cwe: ["CWE-693"],
		triggers:
			"App refuses to run on rooted Android / jailbroken iOS; checks su, Magisk, /system write, Cydia, jailbreak files, SafetyNet/Play Integrity.",
		procedure: [
			"Static: `jadx`/`apktool` grep for `isRooted`, `/system/bin/su`, `Magisk`, `test-keys`, `RootBeer`; iOS: `cydia://`, `/Applications/Cydia`, `fork` test.",
			"Bypass with Frida: hook the root-check methods to force false; `objection` `android root disable` / `ios jailbreak disable`.",
			"Magisk Hide / Zygisk + DenyList for native checks; Shamiko for stricter.",
			"Play Integrity: decouple via `PlayIntegrityFix` module or test on a device that passes; if not, fall back to disabling the gated feature path via Frida.",
		],
		proofExit:
			"App reaches protected functionality on the rooted/jailbroken device after bypass; before/after captured.",
		pitfalls: [
			"Native checks in `.so` aren't caught by Java hooks — patch the native function or its caller.",
			"Server-side SafetyNet/Integrity attestation can't be bypassed client-side alone — needs attestation spoofing or a passing device.",
		],
		tools: ["frida", "objection", "jadx", "apktool", "adb"],
	},
	{
		id: "mobile-crypto-hook",
		name: "Runtime crypto / compare hooking (Frida)",
		domain: "mobile",
		mitre: ["T1056", "T1550.001"],
		cwe: ["CWE-327", "CWE-522"],
		triggers:
			"Need to recover an API signing key, encryption key, or pin/password verification; logic is obfuscated but crypto/compare APIs are standard.",
		procedure: [
			"Hook `javax.crypto.Cipher`/`Mac`/`KeyGenerator`, `SecretKeySpec`, `MessageDigest` to dump key/iv/plaintext/ciphertext.",
			"Hook native `AES_*`/`EVP_*`/`RSA_*`/`mgf1` in OpenSSL/BoringSSL for native crypto.",
			"String compares: hook `String.equals`, `Arrays.equals`, native `strcmp`/`memcmp`/`strncmp` to capture the expected value and brute/leak it.",
			"Rebuild the signing scheme in Python once the key + algorithm are captured; replay requests.",
		],
		proofExit:
			"Recovered key reproduces the exact request signature/decryption on a replayed sample; ≥2 samples match.",
		pitfalls: [
			"Keys derived per-session need the KDF hooked too, not just the cipher.",
			"Constant-time compares hide timing but Frida reads args directly — fine; just don't rely on timing.",
		],
		tools: ["frida", "objection", "python3", "adb"],
	},
];
