/** Context-pack finalize object: identity/resume/core snapshot fields. */

import { memoryPath } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { buildContextPackResumeContract } from "./pack-assembly-finalize-object-resume.ts";
import type { ContextPackArtifact } from "./types.ts";

export function buildContextPackCoreFields(input: {
	mission: any;
	route: any;
	target: any;
	mode: any;
	timestamp: string;
	scope: any;
	contextPath: any;
	idempotencyKey: any;
	closure: any;
	compactionLedger: any;
	resumeArtifactHashes: any;
	autonomousBudget: any;
	active: any;
	checkSummary: any;
	formatMission: any;
	contextEvidenceTail: any;
	contextMemoryTail: any;
	buildToolDigest: any;
	formatCompletionAudit: any;
	artifactIndex: any;
	artifactScopeFilter: any;
	artifactHashes: any;
}): Partial<ContextPackArtifact> {
	const {
		mission,
		route,
		target,
		mode,
		timestamp,
		scope,
		contextPath,
		idempotencyKey,
		closure,
		compactionLedger,
		resumeArtifactHashes,
		autonomousBudget,
		active,
		checkSummary,
		formatMission,
		contextEvidenceTail,
		contextMemoryTail,
		buildToolDigest,
		formatCompletionAudit,
		artifactIndex,
		artifactScopeFilter,
		artifactHashes,
	} = input;
	return {
		contractId: `context-pack/${slug(route ?? target ?? "context")}/${timestamp}`,
		schemaVersion: 2,
		timestamp,
		createdAt: timestamp,
		missionId: mission?.id,
		sessionId: scope.sessionId,
		cwd: scope.cwd,
		workspaceRoot: scope.workspaceRoot,
		route,
		target,
		mode,
		contextPath,
		scope,
		artifactHashes,
		resumeQueueStatus: mode === "resume" ? "done" : "queued",
		idempotencyKey,
		ledgerPath: memoryPath("compaction-resume-ledger.jsonl"),
		closure,
		compactionLedger,
		resumeContract: buildContextPackResumeContract({
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
		}),
		activeLane: active?.name,
		checkSummary,
		missionSnapshot: mission ? formatMission(mission) : "no active mission",
		evidenceTail: contextEvidenceTail,
		memoryTail: contextMemoryTail,
		toolDigest: truncateMiddle(buildToolDigest(), 1200),
		completionAudit: truncateMiddle(formatCompletionAudit(), 1200),
		artifactIndex,
		artifactScopeFilter,
	};
}
