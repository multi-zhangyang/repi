/** Domain-specific runtime reverse capture scoring. */
import type { RuntimeScoreState } from "./runtime-scoring-types.ts";

export type { RuntimeScoreState } from "./runtime-scoring-types.ts";

import { applyWebDomainCapture } from "./runtime-scoring-web-domain.ts";

// Landmark domain signals (bodies in runtime-scoring-web-domain.ts):
// browser_explicit_strong browser_rich_strong js_signing_strong js_signing_explicit_strong
// authz_explicit_strong authz_matrix_strong runtime_capture_strong
export function scoreWebRuntimeCapture(ctx: {
	text: string;
	lines: string[];
	has: (re: RegExp) => boolean;
	count: (re: RegExp) => number;
	domain: "web" | "web_authz";
}): RuntimeScoreState {
	const { text, lines, has, count: _count, domain } = ctx;
	const out: string[] = [];
	const signals: string[] = [];
	let capture = "none";
	let confidence = 0;
	const _tag = domain === "web_authz" ? "web-authz" : "browser";
	const capFlag = (name: string) =>
		lines.some((l: any) => new RegExp(`summary\\.capture\\.${name}=1`, "i").test(l)) ||
		new RegExp(`\\[(?:browser|web-authz|js-signing)-proof-capture\\][^\\n]*${name}=1`, "i").test(text);
	const url =
		has(/\[browser-url\]/i) ||
		has(/\[js-signing-url\]/i) ||
		has(/\[browser-request\][^\n]*url=/i) ||
		has(/\[browser-response\][^\n]*url=/i) ||
		lines.some((l: any) => /summary\.url=/i.test(l)) ||
		capFlag("url");
	const status =
		has(/\[browser-status\]/i) ||
		has(/\[js-signing-fetch\][^\n]*status=\d+/i) ||
		has(/\[browser-response\][^\n]*status=\d+/i) ||
		lines.some((l: any) => /summary\.http_status=/i.test(l)) ||
		capFlag("status");
	const cookies =
		has(/\[browser-cookie\]|set-cookie/i) ||
		lines.some((l: any) => /summary\.set_cookie_signals=/i.test(l)) ||
		capFlag("cookies");
	const api =
		has(/\[browser-(?:xhr|fetch|api)\]/i) ||
		has(/\[repi-js-hook\]|\[js-signing-crypto\]/i) ||
		lines.some(
			(l: any) =>
				/summary\.api_signals=/i.test(l) ||
				/summary\.hook_signals=/i.test(l) ||
				/summary\.crypto_signals=/i.test(l),
		) ||
		capFlag("api") ||
		capFlag("hooks") ||
		capFlag("crypto");
	const sm =
		has(/sourcemap|\.map\b|\[js-signing-sourcemap\]/i) ||
		lines.some((l: any) => /summary\.sourcemap_signals=/i.test(l)) ||
		capFlag("sourcemap");
	const scripts =
		has(/\[browser-script\]|\[js-signing-script\]|\[js-signing-files\]|<script/i) ||
		has(/\[browser-body-head\]/i) ||
		lines.some((l: any) => /summary\.script_signals=/i.test(l)) ||
		capFlag("scripts");
	const route =
		has(/\[web-authz-matrix\]|\[web-authz-state\]/i) ||
		lines.some((l: any) => /summary\.route=/i.test(l)) ||
		capFlag("route");
	const principals =
		lines.some((l: any) => /summary\.principals=/i.test(l)) || has(/principals=/i) || capFlag("principals");
	const objects =
		has(/\[web-authz-object\]/i) || lines.some((l: any) => /summary\.object_checks=/i.test(l)) || capFlag("objects");
	const seq =
		has(/\[web-authz-sequence\]/i) ||
		lines.some((l: any) => /summary\.sequence_steps=/i.test(l)) ||
		capFlag("sequence");
	const rollback =
		has(/\[web-authz-rollback\]/i) || lines.some((l: any) => /summary\.rollback=/i.test(l)) || capFlag("rollback");
	const idor = has(/idor|bola|object.?id|horizontal/i) || capFlag("idor");
	const blocked = /\[(?:browser|web-authz)-blocked\]\s*reason=([^\n]+)/i.exec(text)?.[1]?.trim();
	if (url || route) {
		signals.push(domain === "web_authz" ? "authz_route" : "browser_url");
		confidence += 1;
	}
	if (status) {
		signals.push("http_status");
		confidence += 1;
	}
	if (cookies) {
		signals.push("cookie_session");
		confidence += 2;
	}
	if (api) {
		signals.push("xhr_fetch_api");
		confidence += 2;
	}
	if (sm) {
		signals.push("sourcemap_secrets");
		confidence += 2;
	}
	if (scripts) {
		signals.push("script_inventory");
		confidence += 1;
	}
	if (principals) {
		signals.push("principal_matrix");
		confidence += 2;
	}
	if (objects) {
		signals.push("object_probes");
		confidence += 2;
	}
	if (seq) {
		signals.push("state_sequence");
		confidence += 1;
	}
	if (rollback) {
		signals.push("rollback_check");
		confidence += 1;
	}
	if (idor) {
		signals.push("idor_bola_signal");
		confidence += 2;
	}
	if (blocked) {
		out.push(`summary.blocked=${blocked}`);
		out.push(`query.blocked=${blocked}`);
	}
	const decided = applyWebDomainCapture({
		domain,
		has,
		url,
		status,
		cookies,
		api,
		sm,
		scripts,
		route,
		principals,
		objects,
		seq,
		rollback,
		idor,
		confidence,
		signals,
	});
	capture = decided.capture;
	confidence = decided.confidence;
	signals.splice(0, signals.length, ...decided.signals);

	return { signals, capture, confidence, out };
}
