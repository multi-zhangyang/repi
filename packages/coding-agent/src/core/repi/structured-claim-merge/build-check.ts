/** Structured claim merge check snapshot. */

import type { SwarmArtifact } from "../swarm-runtime.ts";
import { buildStructuredClaimMergeFromSwarm } from "./build-merge.ts";
import type { StructuredClaimMergeCheckSnapshot } from "./deps.ts";
import { claimPromotionEvidenceContract, verifyStructuredClaimMergePromotion } from "./pure.ts";

export function structuredClaimMergeCheckFromSwarm(swarm?: SwarmArtifact): StructuredClaimMergeCheckSnapshot {
	if (!swarm || !swarm.claimLedger?.length) {
		return {
			status: "missing",
			finalClaimCount: 0,
			blockedClaimCount: 0,
			errors: ["structured_claim_merge_missing_runtime_claim_ledger"],
			policies: claimPromotionEvidenceContract(),
		};
	}
	const merge = swarm.structuredClaimMerge ?? buildStructuredClaimMergeFromSwarm(swarm);
	const verification = verifyStructuredClaimMergePromotion(merge);
	return {
		status: verification.ok ? "pass" : "blocked",
		mergePath: swarm.structuredClaimMergePath,
		mergeId: merge.mergeId,
		finalClaimCount: merge.promotionCheck?.finalClaims?.length ?? 0,
		blockedClaimCount: merge.promotionCheck?.blockedClaims?.length ?? 0,
		errors: verification.errors,
		policies: merge.promotionCheck?.policies ?? claimPromotionEvidenceContract(),
	};
}
