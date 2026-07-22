/** Append autofix memory events. */

import type { AutofixArtifact } from "./autofix.ts";
import { autofixMemoryOutcome } from "./memory-events-deps.ts";
import { appendMemoryEvent, type MemoryEventV1 } from "./memory-transaction.ts";
import { uniqueNonEmpty } from "./text.ts";

export function appendAutofixMemoryEvent(autofix: AutofixArtifact, artifactPath: string): MemoryEventV1 {
	const outcome = autofixMemoryOutcome(autofix);
	return appendMemoryEvent({
		source: "autofix",
		task: `autofix ${autofix.mode} ${autofix.target ?? autofix.route ?? "security"}`,
		route: autofix.route,
		target: autofix.target,
		domainTags: ["autofix", "repair_queue", ...(autofix.route ? [autofix.route] : [])],
		outcome,
		lessons: uniqueNonEmpty(
			[
				`Autofix ${autofix.mode}: failures=${autofix.failures.length} patch=${autofix.patchQueue.length} substitutions=${autofix.commandSubstitutions.length} bootstrap=${autofix.bootstrapQueue.length} recapture=${autofix.evidenceRecaptureQueue.length}.`,
				...autofix.operatorFeedback.slice(0, 8),
			],
			24,
		),
		failurePatterns: uniqueNonEmpty(autofix.failures, 32),
		reuseRules: uniqueNonEmpty(
			[
				"Replay failures must flow through patch/substitution/bootstrap/evidence-recapture queues before final claim.",
				...autofix.nextOperatorQueue,
			],
			32,
		),
		commands: uniqueNonEmpty(
			[
				...autofix.patchQueue.map((item: any) => item.command),
				...autofix.commandSubstitutions.map((item: any) => item.command),
				...autofix.bootstrapQueue.map((item: any) => item.command),
				...autofix.evidenceRecaptureQueue.map((item: any) => item.command),
				...autofix.nextOperatorQueue,
				...autofix.applied,
			],
			48,
		),
		artifactPaths: uniqueNonEmpty(
			[artifactPath, autofix.replayArtifact, autofix.compilerArtifact, ...autofix.sourceArtifacts],
			80,
		),
		confidence: autofix.mode === "apply" ? 0.78 : 0.64,
		replayVerified: autofix.mode === "apply" && autofix.applied.length > 0,
		playbookCandidate: outcome === "success" || outcome === "repair",
		verifierRuleCandidate: true,
	});
}
