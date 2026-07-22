/** Lane-run memory event append. */

import { memoryTargetScope } from "./knowledge-scope.ts";
import type { LaneCommandPack } from "./lane-commands.ts";
import type { MemoryOutcome } from "./lane-memory-types.ts";
import { significantLaneFindings } from "./lane-run-mission.ts";
import type { LaneRunAnalysis } from "./lanes/specialist-evidence.ts";
import type { MemoryEventV1 } from "./memory-transaction.ts";
import { appendMemoryEvent } from "./memory-transaction.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";
/**
 * Lane-run memory deposition + reuse feedback (gated memory product path).
 */
import { uniqueNonEmpty } from "./text.ts";

export function appendLaneRunMemoryEvent(
	pack: LaneCommandPack,
	result: { code: number; stdout: string; stderr: string; killed?: boolean },
	analysis: LaneRunAnalysis,
	artifactPath: string,
): MemoryEventV1 | undefined {
	const highValue =
		analysis.critic.verdict === "strong" ||
		analysis.critic.score >= 45 ||
		significantLaneFindings(analysis) ||
		(result.code !== 0 && (analysis.critic.selfHeal.length > 0 || analysis.critic.deficits.length > 0));
	if (!highValue) return undefined;
	const outcome: MemoryOutcome =
		result.killed || analysis.critic.verdict === "weak"
			? "blocked"
			: result.code === 0 && analysis.critic.verdict === "strong"
				? "success"
				: result.code === 0
					? "partial"
					: "repair";
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${pack.route} ${pack.lane} ${pack.target ?? ""}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${pack.route} ${pack.lane}`,
				target: pack.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	const commands = uniqueNonEmpty([...reverseNext, ...pack.commands.map((command: any) => command.command)], 24);
	return appendMemoryEvent({
		source: "operator",
		task: `lane run ${pack.route}/${pack.lane}`,
		route: pack.route,
		target: pack.target,
		domainTags: uniqueNonEmpty(
			[
				"lane-run",
				"runtime-evidence",
				`lane:${pack.lane}`,
				`verdict:${analysis.critic.verdict}`,
				result.code === 0 ? "exit-zero" : "exit-nonzero",
			],
			24,
		),
		outcome,
		lessons: uniqueNonEmpty(
			[
				`Lane ${pack.lane} produced evidence_quality=${analysis.critic.score} verdict=${analysis.critic.verdict} exit=${result.code}.`,
				...analysis.findings.slice(0, 8),
				analysis.nextLane ? `Next lane hint: ${analysis.nextLane}` : undefined,
			],
			20,
		),
		failurePatterns: uniqueNonEmpty(
			[
				...(result.code !== 0 ? [`lane_run_exit_nonzero:${result.code}`] : []),
				...(result.killed ? ["lane_run_killed"] : []),
				...analysis.critic.deficits,
				...analysis.critic.selfHeal.map((command: any) => `self_heal:${command.label}:${command.command}`),
			],
			20,
		),
		reuseRules: uniqueNonEmpty(
			[
				`Reuse ${pack.lane} lane commands when route=${pack.route} target_shape=${pack.target ? memoryTargetScope(pack.target) : "workspace"} and evidence artifacts hash-match.`,
				analysis.critic.verdict === "strong"
					? "Promote only after verifier/replayer confirms the same runtime artifact anchors."
					: "Treat as candidate memory; rerun verifier before claim promotion.",
				...pack.notes.slice(0, 6),
			],
			18,
		),
		commands,
		artifactPaths: [artifactPath],
		confidence: Math.max(0.42, Math.min(0.92, analysis.critic.score / 100)),
		replayVerified: analysis.critic.verdict === "strong" && result.code === 0,
		playbookCandidate: analysis.critic.verdict === "strong" && result.code === 0,
		verifierRuleCandidate: analysis.critic.score >= 45,
		workerRoutingHint: pack.lane,
	});
}
