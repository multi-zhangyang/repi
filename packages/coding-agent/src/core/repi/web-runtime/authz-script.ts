/** Web authz capture script + shell command. */
import { shellQuote } from "../target.ts";
import { webAuthzScriptDeep } from "./authz-script-deep.ts";
import { webAuthzScriptPrincipalMatrix } from "./authz-script-helpers.ts";
import { webAuthzHostShellLines } from "./authz-script-host.ts";
import { webAuthzScriptObjectsAndProof } from "./authz-script-proof.ts";

export function webAuthzStateNodeScript(): string {
	return webAuthzScriptPrincipalMatrix() + webAuthzScriptDeep() + webAuthzScriptObjectsAndProof();
}

export function webAuthzStateShellCommand(url?: string, timeoutMs = 15000): string {
	const urlArg = shellQuote(url?.trim() ?? "");
	const runTimeout = Math.max(3, Math.ceil(timeoutMs / 1000));
	return [
		"set +e",
		`URL=${urlArg}`,
		`printf "[web-authz-env] node=%s curl=%s jq=%s python3=%s timeout=%s\\n" "$(command -v node || true)" "$(command -v curl || true)" "$(command -v jq || true)" "$(command -v python3 || true)" "${runTimeout}s"`,
		'WORK="${REPI_WORKDIR:-$HOME/.repi/agent/recon/runtime/web-authz}"',
		'mkdir -p "$WORK"',
		"cat > \"$WORK/repi-web-authz-state.mjs\" <<'NODE'",
		webAuthzStateNodeScript(),
		"NODE",
		`echo "[web-authz-script] $WORK/repi-web-authz-state.mjs artifact=$WORK/repi-web-authz-state.json principals=\${REPI_AUTHZ_PRINCIPALS:-anon,A,B}"`,
		`if command -v node >/dev/null 2>&1 && [ -n "$URL" ]; then timeout ${runTimeout}s node "$WORK/repi-web-authz-state.mjs" "$URL" 2>&1 | sed "s/^/[web-authz-run] /"; else echo "[web-authz-blocked] reason=node_or_url_missing url=$URL"; fi`,
		...webAuthzHostShellLines(runTimeout),
		'printf "[web-authz-host] node=%s work=%s\\n" "$(command -v node || true)" "$WORK"',
		'printf "[runtime-technique] web-authz-bola-matrix | web-session-cookie-diff | web-browser-state-capture\\n"',
	].join("\n");
}
