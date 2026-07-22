/** Browser reverse runtime capture gate followups + nextLane. */

import { reverseDomainCaptureNextCommands } from "../../../reverse-capture.ts";
import type { LaneCommand } from "../types.ts";

export function finalizeBrowserEvidenceFollowups(params: {
	findings: string[];
	followups: LaneCommand[];
	combined: string;
	targetArg: string;
	packTarget?: string;
	runtimeLines: string[];
	websocketAnchors: string[];
	cdpLines: string[];
	replayLines: string[];
	routeGraphLines: string[];
	authMatrixLines: string[];
	idorProbeLines: string[];
}): { findings: string[]; followups: LaneCommand[]; nextLane?: string } {
	const {
		findings,
		followups,
		combined,
		targetArg,
		packTarget,
		runtimeLines,
		websocketAnchors,
		cdpLines,
		replayLines,
		routeGraphLines,
		authMatrixLines,
		idorProbeLines,
	} = params;
	// reverse/web runtime capture gate (catalog proofExit ≠ completion)
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[web-browser-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		const domainNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `web-browser web-authz live-browser ${combined.slice(0, 400)}`,
			target: packTarget ?? targetArg,
		}).slice(0, 4);
		followups.push(
			{
				label: `web-browser-domain-proof-exit`,
				command: `re_domain_proof_exit show`,
				evidence: "reverse runtime capture gate",
			} as any,
			{
				label: `web-browser-complete-audit`,
				command: `re_complete audit`,
				evidence: "reverse completion audit",
			} as any,
			...domainNext.map(
				(cmd: any, index: any) =>
					({
						label: `web-browser-domain-next-${index + 1}`,
						command: cmd,
						evidence: "reverse domain capture next",
					}) as any,
			),
			{
				label: `web-browser-runtime-adapter`,
				command: `re_runtime_adapter run ${targetArg}`,
				evidence: "runtime adapter capture",
			} as any,
			{
				label: `web-browser-live-browser`,
				command: `re_live_browser run ${targetArg}`,
				evidence: "web live proof path",
			} as any,
		);
	}
	const nextLane =
		authMatrixLines.length > 0 || idorProbeLines.length > 0
			? "authz/poc"
			: runtimeLines.length > 0 ||
					websocketAnchors.length > 0 ||
					cdpLines.length > 0 ||
					replayLines.length > 0 ||
					routeGraphLines.length > 0
				? "state/poc"
				: undefined;
	return { findings, followups, nextLane };
}
