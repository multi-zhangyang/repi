/** Runtime adapter command templates: web. */

export function webCdpNetworkFallbackCommandTemplate(): string {
	return [
		'adapter-web-cdp-network-runner-fallback: target=<target>; body="' +
			"$" +
			'{REPI_RUNTIME_ADAPTER_WORKDIR:-$HOME/.repi/agent/recon/runtime/adapter-web}/body.$$"; headers="' +
			"$" +
			'{REPI_RUNTIME_ADAPTER_WORKDIR:-$HOME/.repi/agent/recon/runtime/adapter-web}/headers.$$"; rm -f "$body" "$headers";',
		'curl -k -L -sS -D "$headers" -o "$body" "$target";',
		'status="$(awk \'toupper($0) ~ /^HTTP\\// {code=$2} END {print code ? code : 0}\' "$headers" 2>/dev/null)";',
		'bytes="$(wc -c < "$body" 2>/dev/null || echo 0)";',
		'printf \'[http-response] status=%s curl_body=%s bytes=%s\\n\' "$status" "$body" "$bytes";',
		'printf \'[web-route-map] source=curl index=1 method=GET status=%s url=%s\\n\' "$status" "$target";',
		"printf '[request-order] index=1 route=%s\\n' \"$target\";",
		'grep -aiE \'^(set-cookie|cookie|authorization|.*csrf.*|.*nonce.*|.*signature.*|.*timestamp.*|etag|location|x-.*sign)\' "$headers" 2>/dev/null | head -80 | while IFS= read -r line; do key="$(printf \'%s\' "$line" | sed -E \'s/:.*$//\')"; value="$(printf \'%s\' "$line" | sed -E \'s/^[^:]*: ?//\')"; key_lower="$(printf \'%s\' "$key" | tr \'A-Z\' \'a-z\')"; printf \'[http-header-signal] %s\\n\' "$line"; printf \'[web-header-signal] source=curl direction=response key=%s value=%s\\n\' "$key_lower" "$(printf \'%s\' "$value" | head -c 400)"; case "$key_lower" in set-cookie) cookie_name="$(printf \'%s\' "$value" | sed -E \'s/^ *([^=;]+)=.*/\\1/\' | head -c 120)"; [ -n "$cookie_name" ] || cookie_name="<cookie>"; printf \'[web-cookie-signal] source=curl direction=response name=%s value_sha256=unhashed\\n\' "$cookie_name" ;; esac; done;',
		"printf '[served-asset-head] '; head -c 12000 \"$body\" 2>/dev/null; printf '\\n';",
		'grep -aEoi "(fetch|XMLHttpRequest|WebSocket|graphql|/api/|wss?://)[^\\"\'<>[:space:]\\)]{0,240}" "$body" 2>/dev/null | awk \'!seen[$0]++ {i++; print "[route-candidate] " $0; print "[request-order] index=" i+1 " route=" $0; print "[web-route-map] source=curl index=" i+1 " method=<unknown> status=<none> url=" $0; if (i >= 40) exit}\';',
		'grep -aEoi "(signature|sign|nonce|timestamp|x-[a-z0-9-]*sign|authorization|csrf)[^\\"\'<>[:space:]\\)]{0,180}" "$body" 2>/dev/null | awk \'!seen[$0]++ {print "[crypto-request-field] " $0; print "[web-signed-field] source=curl field=" $0; if (++i >= 60) exit}\';',
		'rm -f "$body" "$headers"',
		'printf "[web-proof-capture] domain=web capture_signals=1 proof_exit=partial_runtime_capture bind_ready=true note=host-tool-dependent\\n";',
		'printf "[web-proof-capture] next=re_domain_proof_exit_show,re_complete_audit,re_runtime_adapter_run\\n";',
	].join(" ");
}
