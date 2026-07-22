/** Swarm audit reverse merge/query field application. */
import { swarmReverseMergeClaimGate, swarmReverseQuerySignals } from "./reverse-pure.ts";

export function applySwarmReverseAuditFields(params: {
	reverseCorpus: string;
	executionAudit: string[];
	coverageMatrix: string[];
	retryQueue: string[];
}): void {
	const { reverseCorpus, executionAudit, coverageMatrix, retryQueue } = params;
	for (const signal of swarmReverseQuerySignals(reverseCorpus)) {
		if (!executionAudit.includes(signal)) executionAudit.push(signal);
		if (!coverageMatrix.includes(signal)) coverageMatrix.push(signal);
	}
	const mergeGate = swarmReverseMergeClaimGate(reverseCorpus);
	executionAudit.push(
		`reverse.merge_claim_gate=${mergeGate.ready ? "ready" : "blocked"}`,
		`reverse.merge_release=${mergeGate.release}`,
		`reverse.merge_proof_exit=${mergeGate.proofExit}`,
		`reverse.merge_bind_ready=${mergeGate.bindReady ? "true" : "false"}`,
		`reverse.merge_evidence_hashes=${mergeGate.evidenceHashes.length}`,
	);
	if (mergeGate.blocked) {
		for (const reason of mergeGate.reasons.slice(0, 6)) {
			executionAudit.push(`reverse.merge_block=${reason}`);
		}
		for (const cmd of mergeGate.next) {
			retryQueue.push(`reverse_merge_blocked next=${cmd}`);
			executionAudit.push(`reverse.merge_next=${cmd}`);
		}
	}
}
