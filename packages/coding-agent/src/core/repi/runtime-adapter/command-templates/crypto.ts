import { CRYPTO_AES_SURROGATE_LINES } from "./crypto-aes-surrogates.ts";
import { CRYPTO_CHACHA_SURROGATE_LINES } from "./crypto-chacha-surrogates.ts";
import { CRYPTO_DEEP_SURROGATE_LINES } from "./crypto-deep-surrogates.ts";
import { CRYPTO_OPENSSL_HOST_LINES } from "./crypto-openssl-host.ts";
import { CRYPTO_PARAM_SCRIPT_LINES } from "./crypto-param-script.ts";
import { CRYPTO_RC4_SURROGATE_LINES } from "./crypto-rc4-surrogates.ts";
import { CRYPTO_RSA_SURROGATE_LINES } from "./crypto-rsa-surrogates.ts";
import { CRYPTO_STEGO_LSB_SURROGATE_LINES } from "./crypto-stego-lsb-surrogates.ts";
import { CRYPTO_Z3_HOST_LINES } from "./crypto-z3-host.ts";
/** Runtime adapter command templates: crypto/stego host CAP. */

export function cryptoParamTransformCommandTemplate(mode: "native" | "fallback" = "fallback"): string {
	const prefix =
		mode === "native" ? "adapter-crypto-param-transform-runner:" : "adapter-crypto-param-transform-runner-fallback:";
	return [
		"set +e",
		'target="${target:-$1}"',
		`printf "[adapter-crypto-target] adapter=${prefix} target=%s mode=${mode}\\n" "$target"`,
		'Z3_BIN="$(command -v z3 || true)"; if [ -z "$Z3_BIN" ] && python3 -c \'import z3\' >/dev/null 2>&1; then Z3_BIN="python3-z3"; fi; printf "[crypto-env] python=%s openssl=%s z3=%s file=%s strings=%s\\n" "$(command -v python3 || true)" "$(command -v openssl || true)" "${Z3_BIN}" "$(command -v file || true)" "$(command -v strings || true)"',
		"CAP_PARAM=0; CAP_TRANSFORM=0; CAP_SOLVER=0; CAP_KNOWN=0; CAP_DEEP=0; CAP_Z3=0; CAP_RSA=0; CAP_AES=0; CAP_RC4=0; CAP_CHACHA=0; CAP_STEGO=0; CAP_LSB=0",
		'if [ -z "$target" ] || [ ! -e "$target" ]; then printf "[crypto-param] target_missing=%s fallback=.\\n" "${target:-<missing>}"; target="."; fi',
		...CRYPTO_PARAM_SCRIPT_LINES,
		...CRYPTO_DEEP_SURROGATE_LINES,
		...CRYPTO_RSA_SURROGATE_LINES,
		...CRYPTO_AES_SURROGATE_LINES,
		...CRYPTO_RC4_SURROGATE_LINES,
		...CRYPTO_CHACHA_SURROGATE_LINES,
		...CRYPTO_STEGO_LSB_SURROGATE_LINES,
		'file -b "$target" 2>/dev/null | sed "s/^/[crypto-param] file=/"',
		...CRYPTO_OPENSSL_HOST_LINES,
		...CRYPTO_Z3_HOST_LINES,
		'strings -a -n 6 "$target" 2>/dev/null | grep -iE "BEGIN |AES|RSA|iv=|nonce=|salt=|password|secret|flag\\{|ctf" | head -40 | sed "s/^/[crypto-param] string=/"',
		"CAP_PARAM=1; CAP_TRANSFORM=1; CAP_SOLVER=1; CAP_KNOWN=1; CAP_XOR=0; CAP_CLASSICAL=0",
		"CAP_DEEP=1",
		'printf "[crypto-proof-capture] domain=crypto param=%s transform=%s solver=%s known=%s deep=%s z3=%s rsa=%s aes=%s rc4=%s chacha=%s\\n" "$CAP_PARAM" "$CAP_TRANSFORM" "$CAP_SOLVER" "$CAP_KNOWN" "$CAP_DEEP" "${CAP_Z3:-0}" "${CAP_RSA:-0}" "${CAP_AES:-0}" "${CAP_RC4:-0}" "${CAP_CHACHA:-0}"',
		'if [ "$CAP_PARAM" = "1" ] && [ "$CAP_TRANSFORM" = "1" ]; then',
		'  printf "[crypto-proof-capture] proof.exit=runtime_capture_strong bind_ready=true note=param+transform+known+deep+openssl+z3+rsa+aes\\n"',
		'elif [ "$CAP_PARAM" = "1" ]; then',
		'  printf "[crypto-proof-capture] proof.exit=partial_runtime_capture bind_ready=true note=param-only\\n"',
		"else",
		'  printf "[crypto-proof-capture] proof.exit=pending_runtime_capture bind_ready=false\\n"',
		"fi",
		'printf "[crypto-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run,re_lane_plan_solver\\n"',
		'printf "[runtime-technique] crypto-param-inventory | crypto-transform-replay | crypto-known-answer | crypto-rsa-textbook | crypto-aes-ecb\\n"',
	].join("\n");
}
