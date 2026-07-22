/** JS signing shell command wrapper. */
import { shellQuote } from "../target.ts";
import { jsSigningNodeScript } from "./js-signing-script-body.ts";
import { JS_SIGNING_SRI_LINES } from "./js-signing-sri.ts";
import { JS_SIGNING_WASM_LINES } from "./js-signing-wasm.ts";

export function jsSigningShellCommand(target?: string, timeoutMs = 15000): string {
	const targetArg = shellQuote(target?.trim() ?? "");
	const runTimeout = Math.max(3, Math.ceil(timeoutMs / 1000));
	return [
		"set +e",
		`TARGET=${targetArg}`,
		'WORK="${REPI_WORKDIR:-$HOME/.repi/agent/recon/runtime/js-signing}"',
		'mkdir -p "$WORK"',
		`printf "[js-signing-env] node=%s timeout=%s work=%s\\n" "$(command -v node || true)" "${runTimeout}s" "$WORK"`,
		"cat > \"$WORK/repi-js-signing-capture.mjs\" <<'NODE'",
		jsSigningNodeScript(),
		"NODE",
		`echo "[js-signing-script] $WORK/repi-js-signing-capture.mjs target=$TARGET"`,
		`if command -v node >/dev/null 2>&1 && [ -n "$TARGET" ]; then timeout ${runTimeout}s node "$WORK/repi-js-signing-capture.mjs" "$TARGET" 2>&1 | sed "s/^/[js-signing-run] /"; else echo "[js-signing-blocked] reason=node_or_target_missing target=$TARGET"; fi`,
		"CAP_NODE=0; command -v node >/dev/null 2>&1 && CAP_NODE=1",
		'printf "[js-signing-host] node=%s work=%s\n" "$(command -v node || true)" "$WORK"',
		...JS_SIGNING_SRI_LINES,
		...JS_SIGNING_WASM_LINES,
		'printf "[runtime-technique] js-signing-crypto-hook | js-sourcemap-secret | js-request-rebuild\n"',
	].join("\n");
}
