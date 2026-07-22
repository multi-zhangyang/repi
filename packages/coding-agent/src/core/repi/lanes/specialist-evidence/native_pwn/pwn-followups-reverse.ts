/** Pwn reverse runtime capture followups + next lane. */
import { reverseDomainCaptureNextCommands } from "../../../reverse-capture.ts";
import type { PwnEvidenceMeta } from "./pwn-findings.ts";

type LaneCommand = any;

export function appendPwnReverseFollowups(meta: PwnEvidenceMeta): {
	followups: LaneCommand[];
	nextLane?: string;
} {
	const followups: LaneCommand[] = [];
	if (!meta.enabled) return { followups };
	const {
		targetArg,
		findings,
		combined,
		crashLines,
		resolvedOffsets,
		ropLibcLines,
		verifierLines,
		hasAdvancedPwnAnchors,
	} = meta;
	const reverseCaptureOpen =
		!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(combined) ||
		!/bind_ready\s*=\s*true/i.test(combined);
	if (reverseCaptureOpen) {
		findings.push(
			`[pwn-proof-capture] require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true`,
		);
		followups.push(
			{
				label: "pwn-domain-proof-exit",
				command: "re_domain_proof_exit show",
				evidence: "reverse runtime capture gate",
			},
			{
				label: "pwn-complete-audit",
				command: "re_complete audit",
				evidence: "reverse completion audit",
			},
			{
				label: "pwn-runtime-adapter",
				command: `re_runtime_adapter run ${targetArg}`,
				evidence: "runtime adapter capture",
			},
		);
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: `pwn ${targetArg ?? ""} ${findings.join(" ")}`,
		target: targetArg,
		includeGates: true,
	}).slice(0, 4);
	for (const cmd of reverseNext) {
		followups.push({
			label: "pwn-reverse-domain-next",
			command: cmd,
			evidence: "reverse domain capture next",
		});
	}
	const nextLane = hasAdvancedPwnAnchors
		? "advanced-exploit/verify"
		: resolvedOffsets.length > 0 || ropLibcLines.length > 0 || verifierLines.length > 0
			? "exploit/verify"
			: crashLines.length > 0
				? "exploit"
				: undefined;
	return { followups, nextLane };
}
