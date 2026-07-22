/** Completion audit claim/compiler/domain-proof gates. */
export type CompletionAudit = {
	ready: boolean;
	blockers: string[];
	warnings: string[];
	mission?: any;
	domainProofExitClosure?: any;
};

import { buildDomainProofExitClosure } from "../domain-proof-exit.ts";
import { applyReverseCompletionAuditAlign } from "./audit-reverse-align.ts";
import { latestCompilerArtifactPath, parseCompilerArtifact, strictClaimCheckSnapshot } from "./deps.ts";

export function applyCompletionAuditClaimGates(params: {
	mission: any;
	blockers: string[];
	warnings: string[];
	reverseSignals: any;
	hasProofExit: boolean;
}): CompletionAudit {
	const { mission, blockers, warnings, reverseSignals, hasProofExit } = params;
	const strictClaim = strictClaimCheckSnapshot();
	if (strictClaim.status !== "pass") {
		blockers.push(
			`strict claim release marker blocks final claim: ${strictClaim.status} (${strictClaim.markerPath ?? "missing marker"}; run re_complete audit)`,
		);
		for (const gap of strictClaim.requiredGaps.slice(0, 8)) blockers.push(`strict claim release gap: ${gap}`);
	}
	const compilerPath = latestCompilerArtifactPath();
	const compiler = compilerPath ? parseCompilerArtifact(compilerPath) : undefined;
	if (compiler?.mode === "final") {
		if (compiler.strictClaimCheck?.status !== "pass") {
			blockers.push(
				`compiler final artifact is not claim-check ready: strict_claim_check=${compiler.strictClaimCheck?.status ?? "missing"} (${compilerPath})`,
			);
		}
		for (const row of (compiler.claimCheckResult ?? [])
			.filter((item: any) =>
				/final_publish_ready=no|strict_status=(?:blocked|missing)|required_gaps=[1-9]/i.test(item),
			)
			.slice(0, 8)) {
			blockers.push(`compiler claim checkpoint result blocks final report: ${row}`);
		}
		if (compiler.structuredClaimMergeCheck?.status === "blocked") {
			blockers.push(
				`compiler structured claim merge blocks final report: ${compiler.structuredClaimMergeCheck.mergePath ?? "missing merge path"}`,
			);
			for (const error of compiler.structuredClaimMergeCheck.errors.slice(0, 8))
				blockers.push(`compiler structured claim merge error: ${error}`);
		}
		if (!compiler.reportPath) blockers.push(`compiler final artifact has no release report path: ${compilerPath}`);
	}
	const domainProofExitClosure = buildDomainProofExitClosure(mission);
	if (domainProofExitClosure.rows.length > 0 && domainProofExitClosure.domainId) {
		warnings.push(
			`domain_proof_exit_closure: ${domainProofExitClosure.domainId} status=${domainProofExitClosure.status} matched=${domainProofExitClosure.matchedProofExits.length} missing=${domainProofExitClosure.missingProofExits.length}`,
		);
		if (domainProofExitClosure.status !== "passed") {
			for (const blocker of domainProofExitClosure.blockers.slice(0, 10)) blockers.push(blocker);
		}
	}
	applyReverseCompletionAuditAlign({
		mission,
		domainProofExitClosure,
		reverseSignals,
		hasProofExit,
		blockers,
		warnings,
	});
	return { ready: blockers.length === 0, blockers, warnings, mission, domainProofExitClosure };
}
