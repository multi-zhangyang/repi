import { packHasSpecialistSignal } from "../helpers.ts";
import type { SelfHealCtx } from "./ctx.ts";

export function appendCryptoHeals(ctx: SelfHealCtx): void {
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
	if (
		/crypto|stego/.test(route) ||
		packHasSpecialistSignal(pack, /crypto-stego|crypto\/stego|crypto-param|crypto-transform|crypto-solver/i)
	) {
		add(
			"heal-crypto-parameter-inventory",
			target
				? `[ -f /tmp/repi-crypto-inventory.py ] && python3 /tmp/repi-crypto-inventory.py ${target} || strings -a -n 4 ${target} | grep -Ei 'iv|nonce|salt|key|sig|signature|token|cipher|modulus|BEGIN|RSA|AES|base64' | head -220`
				: "find . -maxdepth 5 -type f \\( -iname '*.txt' -o -iname '*.enc' -o -iname '*.bin' -o -iname '*.png' -o -iname '*.jpg' -o -iname '*crypto*' -o -iname '*stego*' \\) -print | head -120",
			"specialist crypto parameter inventory fallback",
		);
		add(
			"heal-crypto-transform-replay",
			target
				? `[ -f /tmp/repi-crypto-transform.py ] && python3 /tmp/repi-crypto-transform.py ${target} || python3 - <<'PY'\nprint('[crypto-transform] rerun crypto-stego-transform-replay-scaffold to regenerate deterministic transform chain')\nPY`
				: "printf '%s\n' 'bind a concrete crypto/stego target before transform replay heal'",
			"specialist crypto transform replay fallback",
		);
		add(
			"heal-crypto-known-answer",
			target
				? `[ -f /tmp/repi-crypto-solver.py ] && REPI_KNOWN_ANSWER="\${REPI_KNOWN_ANSWER:-}" REPI_CANDIDATE="\${REPI_CANDIDATE:-}" python3 /tmp/repi-crypto-solver.py ${target} || printf '%s\n' 'set REPI_KNOWN_ANSWER/REPI_CANDIDATE after solver step'`
				: "printf '%s\n' 'bind target and known-answer/candidate before solver verification heal'",
			"specialist crypto solver/known-answer fallback",
		);
	}
}
