/** Lane run command pack execution. */
// Landmark: reverseDomainCaptureNextCommands ## Reverse Gate proof.exit bind_ready laneRunReverseGateLines

import { truncateMiddle } from "../text.ts";
import {
	analyzeLaneRun,
	appendEvidence,
	appendLaneRunMemoryEvent,
	appendMemoryReuseFeedback,
	applyLaneRunMissionUpdate,
	formatAutopilotExecutionStrategy,
	formatLaneRunAnalysis,
	laneExecutionStrategy,
} from "./deps.ts";
import { formatLaneCommandPack } from "./helpers.ts";
import { writeLaneRunArtifact } from "./run.ts";
import { laneRunReverseGateLines } from "./run-core-reverse.ts";
import type { LaneCommandPack } from "./types.ts";
export async function runLaneCommandPack(
	pi: any,
	pack: LaneCommandPack,
	options: { strategy?: any; applyStrategy?: boolean } = {},
): Promise<string> {
	const strategy = options.strategy ?? (options.applyStrategy === false ? undefined : laneExecutionStrategy(pack));
	const effectivePack = strategy?.pack ?? pack;
	const runnable = effectivePack.commands.filter(
		(command: any) => !/[<][A-Z_]+[>]/.test(command.command) && !/^re_/.test(command.command),
	);
	if (runnable.length === 0)
		return [
			strategy ? formatAutopilotExecutionStrategy(strategy) : "",
			formatLaneCommandPack(effectivePack),
			"",
			"没有可直接运行的命令；需要先提供 target/url、刷新 tool-index、执行 next_bootstrap_command，或由 agent 用对应工具执行 re_* 命令。",
		]
			.filter(Boolean)
			.join("\n");
	const script = [
		"set -u",
		...runnable.map((command: any, index: any) =>
			[`echo '### lane-command ${index + 1}: ${command.label.replace(/'/g, "'\\''")}'`, command.command].join("\n"),
		),
	].join("\n");
	const result = await pi.exec("bash", ["-lc", script], { timeout: 120000 });
	const analysis = analyzeLaneRun(effectivePack, result);
	const artifactPath = writeLaneRunArtifact({ pack: effectivePack, runnable, script, result, analysis });
	const laneRunMemoryEvent = appendLaneRunMemoryEvent(effectivePack, result, analysis, artifactPath);
	const memoryFeedbackEvents = appendMemoryReuseFeedback(effectivePack, result, analysis, artifactPath);
	const evidence = appendEvidence({
		kind: "runtime",
		title: `lane-run ${effectivePack.lane} exit ${result.code}`,
		fact: [
			`Executed ${runnable.length} command(s) for ${effectivePack.route}/${effectivePack.lane}`,
			effectivePack.target ? `target=${effectivePack.target}` : "target=<none>",
			strategy ? `execution_strategy=${strategy.mode}` : undefined,
			strategy?.fallbacks.length ? `fallbacks=${strategy.fallbacks.length}` : undefined,
			strategy?.skipped.length ? `skipped=${strategy.skipped.length}` : undefined,
			`evidence_quality=${analysis.critic.score}`,
			`evidence_verdict=${analysis.critic.verdict}`,
			analysis.critic.selfHeal.length ? `self_heal=${analysis.critic.selfHeal.length}` : undefined,
			`exit=${result.code}`,
			`stdout=${result.stdout.length}B`,
			`stderr=${result.stderr.length}B`,
			result.killed ? "killed=true" : "killed=false",
			`findings=${analysis.findings.map((finding: any) => truncateMiddle(finding, 240)).join(" | ")}`,
			analysis.nextLane ? `next_lane_hint=${analysis.nextLane}` : undefined,
			result.stdout.trim() ? `stdout_head=${truncateMiddle(result.stdout.trim(), 700)}` : undefined,
			result.stderr.trim() ? `stderr_head=${truncateMiddle(result.stderr.trim(), 700)}` : undefined,
		]
			.filter(Boolean)
			.join("; "),
		command: `re_lane run ${effectivePack.lane}${effectivePack.target ? ` ${effectivePack.target}` : ""}`,
		path: artifactPath,
		verify: `cat ${artifactPath}`,
		confidence: "auto-captured lane command run",
	});
	const missionUpdate = applyLaneRunMissionUpdate({ pack: effectivePack, analysis, result, artifactPath });
	return [
		strategy ? formatAutopilotExecutionStrategy(strategy) : "",
		formatLaneCommandPack(effectivePack),
		"",
		...laneRunReverseGateLines(pack, effectivePack),
		"",
		"run_result:",
		`exit: ${result.code}`,
		`evidence_artifact: ${artifactPath}`,
		`evidence_ledger: ${evidence.timestamp} ${evidence.title}`,
		memoryFeedbackEvents.length
			? `memory_reuse_feedback: ${memoryFeedbackEvents.map((event: any) => `${event.id}:${event.outcome}:${event.caseSignature}`).join(", ")}`
			: "",
		laneRunMemoryEvent
			? `memory_auto_writeback: ${laneRunMemoryEvent.id}:${laneRunMemoryEvent.outcome}:${laneRunMemoryEvent.caseSignature}`
			: "",
		missionUpdate.message,
		formatLaneRunAnalysis(analysis),
		result.stdout.trim() ? ["stdout:", "```", truncateMiddle(result.stdout.trim(), 8000), "```"].join("\n") : "",
		result.stderr.trim() ? ["stderr:", "```", truncateMiddle(result.stderr.trim(), 8000), "```"].join("\n") : "",
	]
		.filter(Boolean)
		.join("\n");
}
