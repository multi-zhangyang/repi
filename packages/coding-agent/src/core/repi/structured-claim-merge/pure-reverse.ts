/** Structured claim reverse-heavy final claim gates. */
import type { StructuredClaimMergeV1, StructuredClaimRowV1 } from "./deps.ts";

export function collectStructuredClaimReversePromotionErrors(
	merge: StructuredClaimMergeV1,
	claims: Map<string, StructuredClaimRowV1>,
): string[] {
	const errors: string[] = [];
	for (const finalClaim of merge.promotionCheck?.finalClaims ?? []) {
		const claim = claims.get(finalClaim.claimId);
		if (!claim) continue;
		const blob = [
			claim.claimId,
			claim.workerId,
			claim.statement ?? "",
			JSON.stringify((claim as any).metadata ?? {}),
			...claim.artifactRefs.map((ref: any) => `${ref.artifactId} ${ref.jsonQuery ?? ""} ${ref.sha256 ?? ""}`),
		].join("\n");
		const reverseHeavy =
			/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready/i.test(
				blob,
			);
		if (!reverseHeavy) continue;
		const hasProofExit =
			/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)|proof\.exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(
				blob,
			);
		const bindReady = /bind_ready\s*=\s*true/i.test(blob);
		if (!hasProofExit) errors.push(`reverse_missing_proof_exit_blocks_final:${finalClaim.claimId}`);
		if (!bindReady) errors.push(`reverse_heavy_requires_bind_ready:${finalClaim.claimId}`);
	}
	return errors;
}
