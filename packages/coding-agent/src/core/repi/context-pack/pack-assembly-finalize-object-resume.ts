/** Context-pack resume contract construction. */
import { memoryPath } from "../storage.ts";
import { slug } from "../text.ts";

export function buildContextPackResumeContract(input: {
	route: any;
	target: any;
	timestamp: string;
	scope: any;
	contextPath: any;
	idempotencyKey: any;
	compactionLedger: any;
	resumeArtifactHashes: any;
	autonomousBudget: any;
	closure: any;
	mode: any;
}): any {
	const {
		route,
		target,
		timestamp,
		scope,
		contextPath,
		idempotencyKey,
		compactionLedger,
		resumeArtifactHashes,
		autonomousBudget,
		closure,
		mode,
	} = input;
	return {
		contractId: `resume-contract/${slug(route ?? target ?? "context")}/${timestamp}`,
		schemaVersion: 2,
		compactionEntryId: compactionLedger.entryHash,
		contextPath,
		contextSha256: "0".repeat(64),
		cwd: scope.cwd,
		missionId: scope.missionId ?? "none",
		sessionId: scope.sessionId,
		target: target ?? "workspace",
		artifactHashes: resumeArtifactHashes,
		resumeQueueStatus: mode === "resume" ? "done" : "queued",
		idempotencyKey,
		ledgerPath: memoryPath("compaction-resume-ledger.jsonl"),
		budget: {
			maxResumeTurns: autonomousBudget.maxTurns,
			maxOperatorDispatch: autonomousBudget.maxDispatch,
			maxProofLoops: autonomousBudget.maxProofLoops,
		},
		closure,
	};
}
