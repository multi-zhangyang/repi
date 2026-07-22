/** Claim promotion evidence contract constants. */

export function claimPromotionEvidenceContract(): string[] {
	return [
		"artifact_sha256_required",
		"final_pass_requires_json_query",
		"final_pass_requires_verifier_pass",
		"unresolved_adversary_challenge_blocks_final",
		"unresolved_conflict_blocks_final",
		"conflict_loser_must_be_downgraded",
		"reverse_heavy_requires_runtime_proof_exit",
		"reverse_heavy_requires_bind_ready",
		"reverse_missing_proof_exit_blocks_final",
	];
}
