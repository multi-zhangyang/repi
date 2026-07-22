/** Specialist pack handlers: cloud/identity/agent. */
import type { SpecialistPackContext } from "./types.ts";

export function applyWantsIdentityAd(ctx: SpecialistPackContext): void {
	ctx.specialists.push("Identity/AD graph");
	ctx.add(
		"identity-runtime-repi-bridge",
		ctx.target
			? `printf '%s\n' "re_runtime_adapter run ${ctx.targetArg}" "re_domain_proof_exit show" "re_complete audit"`
			: "printf '[identity-runtime-repi-bridge] target_missing\n'",
		"bridge identity/AD graph work to runtime capture gates before claim",
	);
	ctx.add(
		"identity-ad-principal-enum-scaffold",
		`cat > /tmp/repi-ad-enum.sh <<'SH'\nset +e\nprintf '[ad-principal] ctx.domain=%s dc=%s user=%s ctx.target=%s\\n' "\${DOMAIN:-<unset>}" "\${DC_IP:-<unset>}" "\${USERNAME:-<unset>}" "\${TARGET:-${ctx.target ?? "<TARGET>"}}"\nfor f in /tmp/krb5cc_* ~/.ccache ./*.kirbi ./*.ccache; do [ -e "$f" ] && printf '[kerberos-ticket] path=%s bytes=%s\\n' "$f" "$(wc -c < "$f" 2>/dev/null)"; done\ncommand -v ldapsearch >/dev/null 2>&1 && [ -n "\${LDAP_URL:-}" ] && ldapsearch -LLL -x -H "$LDAP_URL" -b "\${LDAP_BASE:-}" "(|(objectClass=user)(objectClass=group)(servicePrincipalName=*))" dn servicePrincipalName memberOf 2>/dev/null | head -220 | sed 's/^/[ldap-anchor] /'\ncommand -v nxc >/dev/null 2>&1 && [ -n "\${TARGET:-}" ] && nxc smb "$TARGET" --shares -u "\${USERNAME:-}" -p "\${PASSWORD:-}" 2>/dev/null | head -120 | sed 's/^/[ad-principal] nxc=/'\ncommand -v bloodhound-python >/dev/null 2>&1 && printf '[ad-principal] bloodhound-python=present\\n'\ncommand -v certipy >/dev/null 2>&1 && printf '[ad-principal] certipy=present\\n'\ncommand -v impacket-secretsdump >/dev/null 2>&1 && printf '[ad-principal] impacket=present\\n'\nSH\nchmod +x /tmp/repi-ad-enum.sh\n/tmp/repi-ad-enum.sh`,
		"AD principal/protocol/ticket enumeration scaffold driven by DOMAIN/DC_IP/LDAP_URL/TARGET env",
	);
	ctx.add(
		"identity-ad-credential-usability-scaffold",
		`cat > /tmp/repi-ad-credential-check.sh <<'SH'\nset +e\nTARGET="\${TARGET:-${ctx.target ?? "<TARGET>"}}"\nUSER="\${USERNAME:-}"\nPASS="\${PASSWORD:-}"\nHASH="\${NTLM_HASH:-}"\nprintf '[ad-credential-check] ctx.target=%s user=%s pass_set=%s hash_set=%s\\n' "$TARGET" "$USER" "$([ -n "$PASS" ] && echo true || echo false)" "$([ -n "$HASH" ] && echo true || echo false)"\nif command -v nxc >/dev/null 2>&1 && [ "$TARGET" != "<TARGET>" ] && [ -n "$USER" ]; then\n  if [ -n "$HASH" ]; then nxc smb "$TARGET" -u "$USER" -H "$HASH" --shares 2>/dev/null | head -160 | sed 's/^/[ad-credential-check] nxc_hash=/'; fi\n  if [ -n "$PASS" ]; then nxc smb "$TARGET" -u "$USER" -p "$PASS" --shares 2>/dev/null | head -160 | sed 's/^/[ad-credential-check] nxc_pass=/'; fi\nfi\ncommand -v klist >/dev/null 2>&1 && klist 2>/dev/null | sed 's/^/[kerberos-ticket] /' | head -80\nSH\nchmod +x /tmp/repi-ad-credential-check.sh\n/tmp/repi-ad-credential-check.sh`,
		"credential/ticket/hash usability scaffold with controlled env inputs",
	);
	ctx.add(
		"identity-ad-graph-scaffold",
		`cat > /tmp/repi-ad-graph.py <<'PY'\n#!/usr/bin/env python3\nimport json, pathlib, re\nroots=[pathlib.Path('.'), pathlib.Path('/tmp')]\nfiles=[p for root in roots if root.exists() for p in root.rglob('*') if p.is_file() and p.suffix.lower() in {'.json','.txt','.log'} and p.stat().st_size < 20_000_000]\nedge_count=0\nfor path in files[:600]:\n    text=path.read_text(errors='ignore')[:1000000]\n    if re.search(r'BloodHound|AdminTo|MemberOf|GenericAll|GenericWrite|Owns|WriteDacl|AllowedToDelegate|HasSession|CanRDP|ExecuteDCOM', text, re.I):\n        print('[ad-graph-edge]', 'file='+str(path), 'hints='+','.join(sorted(set(re.findall(r'AdminTo|MemberOf|GenericAll|GenericWrite|Owns|WriteDacl|AllowedToDelegate|HasSession|CanRDP|ExecuteDCOM', text, re.I)))[:8]))\n        edge_count += 1\n    if re.search(r'ESC[1-9]|Certificate Templates|Enrollment Rights|Vulnerable|ADCS', text, re.I):\n        print('[ad-cert-edge]', 'file='+str(path), 'hint=adcs/certipy')\n        edge_count += 1\nprint('[ad-graph-summary]', 'files='+str(len(files)), 'edge_files='+str(edge_count))\nPY\nchmod +x /tmp/repi-ad-graph.py\npython3 /tmp/repi-ad-graph.py`,
		"BloodHound/Certipy/ADCS artifact graph edge summarizer",
	);
}
