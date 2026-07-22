/** Lane pack domain: web/js seeds. */

import type { LaneDomainPackCtx } from "./pack-domain-types.ts";

export function appendLaneDomainWebCommands(ctx: LaneDomainPackCtx): void {
	const {
		laneName,
		isNativeRoute: _isNativeRoute,
		isAndroidRoute: _isAndroidRoute,
		isPwnRoute: _isPwnRoute,
		isWebRoute,
		isJsRoute,
		targetIsDirectory: _targetIsDirectory,
		effectiveTarget: _effectiveTarget,
		targetArg: _targetArg,
		targetPython: _targetPython,
		urlArg: _urlArg,
		add,
		notes: _notes,
	} = ctx;
	if (isWebRoute && /surface|map/.test(laneName)) {
		add(
			"route-auth-map",
			'rg -n "route|router|app\\.|fastify|express|auth|session|jwt|csrf|graphql|websocket|worker|queue" .',
			"routes/auth/session surface",
		);
		add(
			"state-files",
			"find . -maxdepth 4 -type f \\( -name '*route*' -o -name '*controller*' -o -name '*api*' -o -name '*auth*' -o -name '.env*' -o -name 'docker-compose*.yml' \\) | sort | head -200",
			"state-bearing files",
		);
	}

	if (isJsRoute && /observe|map|rebuild/.test(laneName)) {
		add(
			"js-network-surface",
			'rg -n "fetch\\(|XMLHttpRequest|axios|WebSocket|crypto|sign|timestamp|nonce|encrypt|decrypt" .',
			"JS signing/network call sites",
		);
		add(
			"source-map-search",
			"find . -maxdepth 5 -type f \\( -name '*.map' -o -name '*.js' -o -name '*.mjs' \\) | head -200",
			"JS chunks and sourcemaps",
		);
	}
}
