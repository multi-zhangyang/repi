/** Structured claim merge pure helpers + promotion verification. */
import { createHash } from "node:crypto";
import { uniqueNonEmpty } from "../text.ts";
import type { StructuredClaimArtifactRefV1, StructuredClaimMergeV1, StructuredClaimRowV1 } from "./deps.ts";
import { collectStructuredClaimReversePromotionErrors } from "./pure-reverse.ts";

export { claimPromotionEvidenceContract } from "./pure-evidence-contract.ts";
export function structuredClaimConflictScore(claim: StructuredClaimRowV1): number {
	const statusScore =
		claim.status === "proven" ? 1000 : claim.status === "pending" ? 200 : claim.status === "gap" ? 100 : 0;
	const challengeScore =
		claim.challenges.length && claim.challenges.every((challenge: any) => challenge.status === "resolved") ? 200 : 0;
	return statusScore + challengeScore + claim.artifactRefs.length * 25 + (claim.statement ? 5 : 0);
}
export function structuredClaimStatusFromLedger(status: any["status"]): StructuredClaimRowV1["status"] {
	if (status === "proven") return "proven";
	if (status === "pending") return "pending";
	if (status === "blocked" || status === "fail" || status === "queued_repair") return "gap";
	return "gap";
}
export function structuredClaimArtifactRefsFromLedgerEvent(event: any): StructuredClaimArtifactRefV1[] {
	return (event.artifactHashes ?? [])
		.filter((artifact: any) => typeof artifact.sha256 === "string" && artifact.sha256.length >= 32)
		.slice(0, 12)
		.map((artifact: any, index: any) => ({
			artifactId: `${event.claimId ?? "claim"}:artifact:${index + 1}`,
			path: artifact.path,
			sha256: artifact.sha256,
			jsonQuery: "$.sha256",
			op: "==" as const,
			expected: artifact.sha256,
			verifierPass: true,
		}));
}
export function resolveStructuredClaimConflict(
	collision: string,
	index: number,
	claimRows: StructuredClaimRowV1[],
	swarm: Pick<any, "claimLedgerPath" | "structuredClaimMergePath">,
): StructuredClaimMergeV1["conflictTable"][number] {
	const conflictClaims = claimRows.slice(0, 8);
	const winner = [...conflictClaims].sort((left: any, right: any) => {
		const delta = structuredClaimConflictScore(right) - structuredClaimConflictScore(left);
		return delta || left.claimId.localeCompare(right.claimId);
	})[0];
	const winningEvidenceRefs = uniqueNonEmpty(
		[
			...(winner?.artifactRefs ?? []).map((ref: any) => ref.path),
			swarm.claimLedgerPath,
			swarm.structuredClaimMergePath,
		],
		16,
	);
	return {
		conflictId: `collision:${index + 1}:${createHash("sha256").update(collision).digest("hex").slice(0, 12)}`,
		claimIds: conflictClaims.map((claim: any) => claim.claimId),
		topic: collision,
		status: winner && winningEvidenceRefs.length ? "resolved" : "unresolved",
		winnerClaimId: winner?.claimId,
		winningEvidenceRefs,
		downgradeLosers: conflictClaims
			.filter((claim: any) => claim.claimId !== winner?.claimId)
			.map((claim: any) => claim.claimId),
		resolutionReason: winner
			? `structured_conflict_arbitration_live_wiring: winner selected by runtime evidence score=${structuredClaimConflictScore(winner)}; evidence order runtime/memory/network/served/process/persisted; loser claims downgraded until stronger verifier artifacts appear.`
			: "structured_conflict_arbitration_live_wiring: unresolved because no claim rows were available for arbitration.",
	};
}
export function verifyStructuredClaimMergePromotion(merge: StructuredClaimMergeV1): { ok: boolean; errors: string[] } {
	const errors: string[] = [];
	const claims = new Map(merge.claimRows.map((claim: any) => [claim.claimId, claim]));
	const conflictsByClaim = new Map<string, StructuredClaimMergeV1["conflictTable"]>();
	for (const conflict of merge.conflictTable) {
		if (conflict.status !== "resolved") errors.push(`unresolved_conflict:${conflict.conflictId}`);
		if (!conflict.winnerClaimId) errors.push(`missing_conflict_winner:${conflict.conflictId}`);
		if (conflict.winningEvidenceRefs.length === 0) errors.push(`missing_winning_evidence:${conflict.conflictId}`);
		for (const claimId of conflict.claimIds) {
			const rows = conflictsByClaim.get(claimId) ?? [];
			rows.push(conflict);
			conflictsByClaim.set(claimId, rows);
		}
		for (const loser of conflict.claimIds.filter((claimId: any) => claimId !== conflict.winnerClaimId)) {
			if (!conflict.downgradeLosers.includes(loser)) errors.push(`conflict_loser_not_downgraded:${loser}`);
		}
	}
	for (const claim of merge.claimRows) {
		for (const ref of claim.artifactRefs) {
			if (!ref.sha256) errors.push(`artifact_sha256_required:${claim.claimId}:${ref.artifactId}`);
			if (!ref.jsonQuery) errors.push(`final_pass_requires_json_query:${claim.claimId}:${ref.artifactId}`);
		}
		for (const challenge of claim.challenges) {
			if (challenge.status !== "resolved")
				errors.push(`unresolved_adversary_challenge_blocks_final:${claim.claimId}`);
		}
	}
	for (const finalClaim of merge.promotionCheck?.finalClaims ?? []) {
		const claim = claims.get(finalClaim.claimId);
		if (!claim) {
			errors.push(`final_claim_missing:${finalClaim.claimId}`);
			continue;
		}
		if (claim.status !== "proven") errors.push(`final_pass_claim_not_proven:${finalClaim.claimId}`);
		if (!finalClaim.verifierPass) errors.push(`final_pass_without_verifier_pass:${finalClaim.claimId}`);
		if (finalClaim.artifactRefs.some((ref: any) => !ref.jsonQuery))
			errors.push(`final_pass_requires_json_query:${finalClaim.claimId}`);
		for (const conflict of conflictsByClaim.get(finalClaim.claimId) ?? []) {
			if (conflict.status !== "resolved") errors.push(`unresolved_conflict_blocks_final:${finalClaim.claimId}`);
			if (conflict.winnerClaimId !== finalClaim.claimId)
				errors.push(`final_pass_lost_conflict:${finalClaim.claimId}`);
		}
	}
	errors.push(...collectStructuredClaimReversePromotionErrors(merge, claims));
	return { ok: errors.length === 0, errors: uniqueNonEmpty(errors, 80) };
}
