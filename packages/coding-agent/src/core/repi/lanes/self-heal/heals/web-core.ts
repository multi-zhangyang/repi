/** Web self-heal core packs (auth/map/js). */
import { shellQuote } from "../../../target.ts";
import { packHasSpecialistSignal, toolRepairMatrixScript, transcriptRepairItems } from "../helpers.ts";
import type { SelfHealCtx } from "./ctx.ts";

export function appendWebCoreHeals(ctx: SelfHealCtx): void {
	const {
		pack,
		result: _result,
		findings: _findings,
		deficits,
		route,
		combined,
		target,
		add,
		toolNames: _toolNames,
	} = ctx;
	if (/web|api/.test(route)) {
		add(
			"heal-web-route-auth-map",
			'rg -n "route|router|app\\.|fastify|express|koa|flask|django|jwt|session|cookie|csrf|cors|auth|oauth|permission|rbac" . 2>/dev/null | head -360',
			"web route/auth surface map for missing authz coverage",
		);
		add(
			"heal-web-authz-static-rerun",
			`[ -f /tmp/repi-web-authz-static.py ] && python3 /tmp/repi-web-authz-static.py ${target ? shellQuote(target) : "."} || rg -n "authorize|permission|role|scope|principal|policy|guard|middleware" . 2>/dev/null | head -240`,
			"rerun static web authz source map",
		);
		add(
			"heal-web-live-browser-capture",
			target ? `re_live_browser run ${shellQuote(target)}` : "re_live_browser run <url>",
			"live browser runtime capture for auth/session anchors",
		);
		add(
			"heal-web-authz-state-run",
			target ? `re_web_authz_state run ${shellQuote(target)}` : "re_web_authz_state run <url>",
			"authz state machine runtime capture",
		);
	}
	if (
		/js|frontend|browser|signing|spa/i.test(route) ||
		packHasSpecialistSignal(pack, /js-signing|live-browser|web-authz/i)
	) {
		add(
			"heal-js-signing-rerun",
			target ? `re_js_signing run ${shellQuote(target)}` : "re_js_signing run <url-or-bundle>",
			"js signing/hook runtime capture",
		);
		add(
			"heal-js-replay-harness",
			`[ -f /tmp/repi-js-replay-harness.mjs ] && node /tmp/repi-js-replay-harness.mjs || printf '%s\n' 'set REPI_REPLAY_URL and signature env before signed replay verification'`,
			"specialist JS signed replay harness fallback",
		);
	}
	if (
		deficits.some((d: any) => /tool|browser|playwright|curl|ffuf/i.test(String(d))) ||
		/tool missing|not found/i.test(combined)
	) {
		add(
			"heal-web-tool-bootstrap",
			toolRepairMatrixScript({
				pack,
				combined,
				repairItems: ["curl", "ffuf", "playwright", "node"],
				errorLines: transcriptRepairItems(combined).slice(0, 8),
			}),
			"bootstrap missing web capture tools",
		);
	}
	for (const item of transcriptRepairItems(combined).slice(0, 4)) {
		add(`heal-web-transcript-${item.slice(0, 24)}`, item, "transcript-derived web repair command");
	}
}
