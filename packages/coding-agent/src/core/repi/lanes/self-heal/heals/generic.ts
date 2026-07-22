import type { SelfHealCtx } from "./ctx.ts";

export function appendGenericHeals(ctx: SelfHealCtx): void {
	const {
		pack: _pack,
		result: _result,
		findings,
		deficits,
		route: _route,
		combined: _combined,
		target: _target,
		add,
		toolNames: _toolNames,
	} = ctx;
	if (deficits.includes("no high-signal anchors parsed")) {
		add(
			"heal-generic-signal-search",
			'rg -n "TODO|secret|token|key|auth|password|flag|license|verify|admin|debug|strcmp|memcmp|jwt|session|sign" . 2>/dev/null | head -260',
			"generic high-signal keyword search",
		);
	}
	if (findings.some((finding: any) => /next command pack candidates/.test(finding))) {
		add(
			"heal-replay-followups",
			"printf '%s\\n' 'follow-up candidates already emitted; run re_lane run-auto 1 after reviewing tool strategy'",
			"operator reminder for queued follow-ups",
		);
	}
}
