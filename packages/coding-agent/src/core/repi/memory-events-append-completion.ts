/** Append completion memory events (reverse proof productization). */
// Landmark: reverseDomainCaptureNextCommands reverse_proof_exit domain_proof_exit appendCompletionMemoryEvent

import type { CompletionAudit } from "./completion-audit.ts";
import {
	completionMemoryDomainTags,
	completionMemoryReuseRules,
	completionMemoryReverseCommands,
} from "./memory-events-append-completion-reverse.ts";
import {
	latestCompilerArtifactPath,
	latestContextPackArtifactPath,
	latestProofLoopArtifactPath,
	latestSupervisorArtifactPath,
} from "./memory-events-deps.ts";
import { appendMemoryEvent, type MemoryEventV1 } from "./memory-transaction.ts";
import { currentMissionPath, evidenceLedgerPath } from "./storage.ts";
import { uniqueNonEmpty } from "./text.ts";

export function appendCompletionMemoryEvent(audit: CompletionAudit, artifactPath?: string): MemoryEventV1 | undefined {
	if (!audit.mission) return undefined;
	return appendMemoryEvent({
		source: "complete",
		task: `completion audit ${audit.mission.task}`,
		route: audit.mission.route.domain,
		target: audit.mission.task,
		domainTags: completionMemoryDomainTags(audit),
		outcome: audit.ready ? "success" : "blocked",
		lessons: uniqueNonEmpty(
			[
				`Completion audit ${audit.ready ? "ready" : "blocked"}: blockers=${audit.blockers.length} warnings=${audit.warnings.length}.`,
				audit.domainProofExitClosure
					? `DomainProofExitClosureV1 ${audit.domainProofExitClosure.domainId ?? "unmapped"} status=${audit.domainProofExitClosure.status} missing=${audit.domainProofExitClosure.missingProofExits.length}.`
					: undefined,
				...audit.blockers
					.filter((b: any) => /reverse_proof_exit|reverse_domain_proof|proof_exit/i.test(b))
					.slice(0, 8),
				...audit.warnings,
			],
			32,
		),
		failurePatterns: uniqueNonEmpty(
			[...audit.blockers, ...audit.blockers.filter((b: any) => /reverse|proof_exit/i.test(b))],
			48,
		),
		reuseRules: completionMemoryReuseRules(audit),
		commands: uniqueNonEmpty(["re_complete audit", ...completionMemoryReverseCommands(audit)], 16),
		artifactPaths: uniqueNonEmpty(
			[
				artifactPath,
				currentMissionPath(),
				evidenceLedgerPath(),
				latestContextPackArtifactPath(),
				latestProofLoopArtifactPath(),
				latestCompilerArtifactPath(),
				latestSupervisorArtifactPath(),
				...(audit.domainProofExitClosure?.artifactSources ?? []),
			],
			80,
		),
		confidence: audit.ready ? 0.86 : 0.7,
		replayVerified: audit.ready,
		playbookCandidate: audit.ready,
		verifierRuleCandidate: true,
	});
}
