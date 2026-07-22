/** Live browser capture node script + shell wrapper. */
import { shellQuote } from "../target.ts";
import { liveBrowserNodeScript } from "./browser-capture-script-body.ts";

export { liveBrowserNodeScript } from "./browser-capture-script-body.ts";

export function liveBrowserShellCommand(url: string, timeoutMs: number): string {
	return [
		'WORK="${REPI_WORKDIR:-$HOME/.repi/agent/recon/runtime/live-browser}"',
		'mkdir -p "$WORK"',
		'export NODE_PATH="/usr/lib/node_modules:/usr/local/lib/node_modules${NODE_PATH:+:$NODE_PATH}"',
		"cat > \"$WORK/repi-live-browser.js\" <<'JS'",
		liveBrowserNodeScript(),
		"JS",
		`timeout ${Math.ceil(timeoutMs / 1000) + 5}s node "$WORK/repi-live-browser.js" ${shellQuote(url)} ${Math.floor(timeoutMs)}`,
		'printf "[browser-env] node=%s work=%s\\n" "$(command -v node || true)" "$WORK"',
		'printf "[browser-host] node=%s work=%s\\n" "$(command -v node || true)" "$WORK"',
		'printf "[runtime-technique] web-browser-state-capture | web-session-cookie-diff | js-request-rebuild\\n"',
	].join("\n");
}
