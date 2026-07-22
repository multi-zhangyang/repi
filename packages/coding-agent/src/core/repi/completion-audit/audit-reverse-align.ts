/** Align reverse proof_exit with domain proof-exit closure in completion audit. */
import { reverseProofExitMissingBlockers, reverseTechniqueProofChecklist } from "../reverse-evidence.ts";

export function applyReverseCompletionAuditAlign(input: {
	mission: any;
	domainProofExitClosure: any;
	reverseSignals: string[];
	hasProofExit: boolean;
	blockers: string[];
	warnings: string[];
}): void {
	const { mission, domainProofExitClosure, reverseSignals, hasProofExit, blockers, warnings } = input;
	if (reverseSignals.length === 0) return;
	const domainMissing = domainProofExitClosure.missingProofExits ?? [];
	if (domainMissing.length > 0) {
		warnings.push(
			`reverse_domain_proof_align: reverse anchors present; domain missing proof-exits=${domainMissing.slice(0, 6).join(",")}`,
		);
	}
	if (
		!hasProofExit &&
		domainProofExitClosure.status &&
		domainProofExitClosure.status !== "passed" &&
		!blockers.some((b: any) => b.startsWith("reverse_proof_exit_missing"))
	) {
		blockers.push(
			`reverse_domain_proof_exit_unaligned: reverse technique anchors without proof_exit and domain_proof_exit status=${domainProofExitClosure.status}`,
		);
	}
	const reverseChecklist = mission?.route?.domain
		? reverseTechniqueProofChecklist(mission.route.domain)
		: { techniqueIds: [] as string[], proofExits: [] as string[], requiredCommands: [] as string[] };
	const techniqueIds = Array.from(
		new Set([
			...reverseChecklist.techniqueIds,
			...reverseSignals
				.map((s: any) => /technique[=:\s]+([A-Za-z0-9_./-]+)/i.exec(s)?.[1])
				.filter((x): x is string => Boolean(x)),
		]),
	);
	for (const blocker of reverseProofExitMissingBlockers({
		techniqueIds,
		hasProofExit,
		routeDomain: mission?.route?.domain,
	})) {
		if (!blockers.some((b: any) => b === blocker)) blockers.push(blocker);
	}
	if (hasProofExit && domainProofExitClosure.status === "passed") {
		warnings.push("reverse_domain_proof_align: reverse proof_exit and domain proof-exit both satisfied");
	}
}
