/** Worker retry handoff evidence contracts. */

export function workerRetryHandoffClosureEvidenceContract(): string[] {
	return [
		"reverse: runtime capture required before claim when worker domain is reverse-heavy",
		"reverse: proof.exit must be partial_runtime_capture|runtime_capture_strong",
		"reverse: bind_ready=true required; next re_domain_proof_exit show / re_complete audit / re_runtime_adapter run",

		"WorkerRetryHandoffClosureV1",
		"runtime:retry-handoff-closure-validation",
		"retry attempts must not exceed maxAttempts",
		"timeout/cancel closure must record cancelledAt",
		"failed workers must have retryQueueRefs, repairRefs, or handoffRefs",
		"exhausted workers must escalate with repairRefs and no hidden retry",
		"handoffRefs must bind to claimRefs before merge",
		"retry/handoff/repair refs must be preserved in sourceArtifacts",
		"merge collisions must be resolved or block promotion",
		"resolved merge collisions must name real workers, a valid winner, bound evidence refs, and a resolution reason",
	];
}

export function workerRetryHandoffMergeSummaryEvidenceContract(): string[] {
	return [
		"reverse: merge summary must not clear blocked_until_runtime_capture_and_bind_ready without capture",

		"WorkerRetryHandoffMergeSummaryV1",
		"runtime:retry-handoff-merge-summary-validation",
		"retry queued workers must remain retry-budget visible before supervisor merge",
		"handoff recovered workers must keep handoff refs claim-bound and source-artifact preserved",
		"exhausted workers must surface an explicit re_autofix/re_supervisor escalation next action",
		"every worker must emit a workerClosures row with timeout/cancel, retry budget, handoff refs, repair refs, claim refs, and next action",
		"unresolved workers or unresolved merge collisions must block promotion",
		"pass status requires no unresolved workers, resolved collisions, closed failures, and preserved artifacts",
	];
}
