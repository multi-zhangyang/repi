/** Append replayer memory events. */

import { replayMemoryOutcome } from "./memory-events-deps.ts";
import { appendMemoryEvent, type MemoryEventV1 } from "./memory-transaction.ts";
import type { ReplayArtifact } from "./runtime-types.ts";
import { uniqueNonEmpty } from "./text.ts";

export function appendReplayerMemoryEvent(replay: ReplayArtifact, artifactPath: string): MemoryEventV1 {
	const outcome = replayMemoryOutcome(replay);
	return appendMemoryEvent({
		source: "replayer",
		task: `replayer ${replay.mode} ${replay.target ?? replay.route ?? "security"}`,
		route: replay.route,
		target: replay.target,
		domainTags: ["replayer", "replay_matrix", ...(replay.route ? [replay.route] : [])],
		outcome,
		lessons: uniqueNonEmpty(
			[
				`Replay ${replay.mode}: passed=${replay.passed} failed=${replay.failed} blocked=${replay.blocked.length} executed=${replay.executions.length}.`,
				...replay.replayMatrix.slice(0, 8),
			],
			20,
		),
		failurePatterns: uniqueNonEmpty(
			[
				...replay.blocked,
				...replay.executions
					.filter((execution: any) => execution.status === "failed")
					.map(
						(execution: any) =>
							`failed replay ${execution.stepId} exit=${execution.exit} command=${execution.command}`,
					),
			],
			24,
		),
		reuseRules: uniqueNonEmpty(
			[
				outcome === "success"
					? "Reuse the passed replay matrix before final claim promotion."
					: "Route failed/blocked replay rows through re_autofix before final claim.",
				...replay.nextActions,
			],
			24,
		),
		commands: uniqueNonEmpty(
			[
				...replay.steps.map((step: any) => step.command),
				...replay.executions.map((execution: any) => execution.command),
				...replay.nextActions,
			],
			40,
		),
		artifactPaths: uniqueNonEmpty([artifactPath, replay.compilerArtifact, ...replay.sourceArtifacts], 80),
		confidence: replay.mode === "run" ? (outcome === "success" ? 0.86 : 0.72) : 0.58,
		replayVerified: replay.passed > 0 && replay.failed === 0 && replay.blocked.length === 0,
		playbookCandidate: outcome === "success",
		verifierRuleCandidate: replay.replayMatrix.length > 0,
	});
}
