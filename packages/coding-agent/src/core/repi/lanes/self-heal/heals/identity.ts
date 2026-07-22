import { packHasSpecialistSignal } from "../helpers.ts";
import type { SelfHealCtx } from "./ctx.ts";

export function appendIdentityHeals(ctx: SelfHealCtx): void {
	const {
		pack,
		result: _result,
		findings: _findings,
		deficits: _deficits,
		route,
		combined: _combined,
		target: _target,
		add,
		toolNames: _toolNames,
	} = ctx;
	if (
		/identity|windows|ad/.test(route) ||
		packHasSpecialistSignal(pack, /identity-ad|Identity\/AD graph|ad-principal|ad-credential|ad-graph/i)
	) {
		add(
			"heal-identity-ad-enum",
			"[ -f /tmp/repi-ad-enum.sh ] && /tmp/repi-ad-enum.sh || env | grep -Ei 'DOMAIN|DC_IP|LDAP|KRB5|USERNAME|TARGET' | sort",
			"specialist AD principal/protocol enumeration fallback",
		);
		add(
			"heal-identity-ad-credential-check",
			"[ -f /tmp/repi-ad-credential-check.sh ] && /tmp/repi-ad-credential-check.sh || printf '%s\n' 'set TARGET/USERNAME/PASSWORD or NTLM_HASH before credential usability heal'",
			"specialist AD credential usability fallback",
		);
		add(
			"heal-identity-ad-graph",
			"[ -f /tmp/repi-ad-graph.py ] && python3 /tmp/repi-ad-graph.py || find . /tmp -maxdepth 3 -type f \\( -iname '*.json' -o -iname '*bloodhound*' -o -iname '*certipy*' \\) -print 2>/dev/null | head -120",
			"specialist AD graph edge fallback",
		);
	}
}
