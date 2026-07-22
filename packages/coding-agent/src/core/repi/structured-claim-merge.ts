/**
 * Structured claim merge and promotion checks for swarm claim ledgers.
 */

export {
	buildStructuredClaimMergeFromSwarm,
	refreshSwarmRuntimeClaimLedger,
	structuredClaimMergeCheckFromSwarm,
} from "./structured-claim-merge/build.ts";
export type {
	StructuredClaimArtifactRefV1,
	StructuredClaimMergeCheckSnapshot,
	StructuredClaimMergeDeps,
	StructuredClaimMergeV1,
	StructuredClaimRowV1,
} from "./structured-claim-merge/deps.ts";
export { configureStructuredClaimMerge } from "./structured-claim-merge/deps.ts";
export {
	claimPromotionEvidenceContract,
	resolveStructuredClaimConflict,
	structuredClaimArtifactRefsFromLedgerEvent,
	structuredClaimConflictScore,
	structuredClaimStatusFromLedger,
	verifyStructuredClaimMergePromotion,
} from "./structured-claim-merge/pure.ts";
