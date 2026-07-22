/** Reverse proof/bind gates for structured claim final promotion. */
import type { StructuredClaimRowV1 } from "./deps.ts";

export function reverseClaimBlocked(claim: StructuredClaimRowV1): boolean {
	const meta = (claim as any).metadata ?? {};
	const blob = `${claim.claimId} ${claim.workerId} ${claim.statement ?? ""} ${JSON.stringify(meta)}`;
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready/i.test(
			blob,
		);
	if (!reverseHeavy) return false;
	if (meta.reverseBlocked === true) return true;
	const hasProofExit =
		meta.reverseProofExit === "partial_runtime_capture" ||
		meta.reverseProofExit === "runtime_capture_strong" ||
		/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(blob);
	const bindReady = meta.reverseBindReady === true || /bind_ready\s*=\s*true/i.test(blob);
	return !hasProofExit || !bindReady;
}

export function filterStructuredClaimPromotion(
	claimRows: StructuredClaimRowV1[],
	provenIds: Set<string>,
	conflictLoserIds: Set<string>,
	conflictWinnerIds: Set<string>,
	conflictTableLength: number,
): {
	finalClaims: Array<{
		claimId: string;
		promotion: "final_pass";
		reportSection: string;
		verifierPass: boolean;
		artifactRefs: string[];
	}>;
	blockedClaims: Array<{ claimId: string; reason: string }>;
} {
	const finalClaims = claimRows
		.filter(
			(claim: any) =>
				claim.status === "proven" &&
				claim.artifactRefs.length > 0 &&
				claim.challenges.every((challenge: any) => challenge.status === "resolved") &&
				!conflictLoserIds.has(claim.claimId) &&
				(conflictTableLength === 0 || conflictWinnerIds.has(claim.claimId)) &&
				!reverseClaimBlocked(claim),
		)
		.map((claim: any) => ({
			claimId: claim.claimId,
			promotion: "final_pass" as const,
			reportSection: `worker:${claim.workerId}`,
			verifierPass: true,
			artifactRefs: claim.artifactRefs,
		}));
	const blockedClaims = claimRows
		.filter(
			(claim: any) =>
				!provenIds.has(claim.claimId) ||
				claim.challenges.some((challenge: any) => challenge.status !== "resolved") ||
				claim.artifactRefs.length === 0 ||
				conflictLoserIds.has(claim.claimId) ||
				reverseClaimBlocked(claim),
		)
		.map((claim: any) => ({
			claimId: claim.claimId,
			reason: conflictLoserIds.has(claim.claimId)
				? "lost_structured_conflict_arbitration"
				: reverseClaimBlocked(claim)
					? "reverse_missing_proof_exit_blocks_final"
					: claim.artifactRefs.length === 0
						? "artifact_sha256_required"
						: claim.challenges.some((challenge: any) => challenge.status !== "resolved")
							? "unresolved_adversary_challenge_blocks_final"
							: `claim_status_${claim.status}`,
		}));
	return { finalClaims, blockedClaims };
}
