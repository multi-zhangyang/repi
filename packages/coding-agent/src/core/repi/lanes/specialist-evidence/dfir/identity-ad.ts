/** Specialist evidence analyzer: identity-ad. */
import type { LaneCommand, LaneCommandPack } from "../../../lane-commands/types.ts";
import { interestingLines, truncateMiddle } from "../../../text.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";

export function analyzeIdentityAdEvidence(pack: LaneCommandPack, combined: string): SpecialistEvidenceAnalysis {
	const targetArg = pack.target ?? "<target>";
	const enabled =
		/identity|windows|ad/i.test(pack.route) ||
		packHasSpecialistSignal(pack, /identity-ad|Identity\/AD graph|ad-principal|ad-credential|ad-graph/i);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: LaneCommand[] = [];
	const principalLines = interestingLines(
		combined,
		/\[ad-principal\]|\[ldap-anchor\]|servicePrincipalName|distinguishedName/i,
		18,
	);
	if (principalLines.length > 0) {
		findings.push(
			`Identity/AD principal anchors: ${principalLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const credentialLines = interestingLines(
		combined,
		/\[ad-credential-check\]|\[kerberos-ticket\]|Pwn3d!|STATUS_|KRB5CCNAME|NT_STATUS/i,
		18,
	);
	if (credentialLines.length > 0) {
		findings.push(
			`Identity/AD credential usability anchors: ${credentialLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	const graphLines = interestingLines(
		combined,
		/\[ad-graph-edge\]|\[ad-cert-edge\]|\[ad-graph-summary\]|GenericAll|GenericWrite|WriteDacl|AdminTo|MemberOf|ESC[1-9]/i,
		22,
	);
	if (graphLines.length > 0) {
		findings.push(
			`Identity/AD graph edge anchors: ${graphLines.map((line: any) => truncateMiddle(line, 180)).join(" | ")}`,
		);
	}
	if (principalLines.length > 0 || credentialLines.length > 0 || graphLines.length > 0) {
		followups.push({
			label: "identity-ad-enum-rerun",
			command:
				"[ -f /tmp/repi-ad-enum.sh ] && /tmp/repi-ad-enum.sh || printf '%s\n' 'rerun identity-ad-principal-enum-scaffold after setting DOMAIN/DC_IP/LDAP_URL/TARGET env'",
			evidence: "rerun AD principal/protocol/ticket enumeration scaffold",
		});
		followups.push({
			label: "identity-ad-credential-check-rerun",
			command:
				"[ -f /tmp/repi-ad-credential-check.sh ] && /tmp/repi-ad-credential-check.sh || printf '%s\n' 'rerun identity-ad-credential-usability-scaffold after setting TARGET/USERNAME/PASSWORD or NTLM_HASH'",
			evidence: "rerun credential/ticket/hash usability check with controlled env",
		});
		followups.push({
			label: "identity-ad-graph-rerun",
			command:
				"[ -f /tmp/repi-ad-graph.py ] && python3 /tmp/repi-ad-graph.py || find . /tmp -maxdepth 3 -type f \\( -iname '*.json' -o -iname '*certipy*' -o -iname '*bloodhound*' \\) -print 2>/dev/null | head -120",
			evidence: "rerun BloodHound/Certipy graph edge summarizer",
		});
		followups.push({
			label: "identity-ad-report-scaffold",
			command:
				"python3 - <<'PY'\nprint('[ad-report] inputs=principal,credential,graph anchors')\nprint('Next: prove one minimal usable credential or graph edge, record exact command/status, then update attack graph.')\nPY",
			evidence: "consolidated identity/AD report scaffold",
		});
	}

	// reverse runtime capture gate (catalog proofExit ≠ completion)
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[identity-ad-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		followups.push(
			{
				label: `identity-ad-domain-proof-exit`,
				command: `re_domain_proof_exit show`,
				evidence: "reverse runtime capture gate",
			} as any,
			{
				label: `identity-ad-complete-audit`,
				command: `re_complete audit`,
				evidence: "reverse completion audit",
			} as any,
			{
				label: `identity-ad-runtime-adapter`,
				command: `re_runtime_adapter run ${targetArg}`,
				evidence: "runtime adapter capture",
			} as any,
		);
	}
	return {
		findings,
		followups,
		nextLane:
			graphLines.length > 0
				? "pivot-proof/report"
				: credentialLines.length > 0
					? "graph/pivot-proof"
					: principalLines.length > 0
						? "credentials/graph"
						: undefined,
	};
}
