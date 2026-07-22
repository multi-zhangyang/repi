/** Replayer write/run/output I/O. */
import { join } from "node:path";
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { latestScopedMarkdownArtifact } from "../artifact-scope.ts";
import { appendRuntimeFailureRepairFromReplay } from "../failure-repair.ts";
import { appendReplayerMemoryEvent } from "../memory-events.ts";
import { ensureReconStorage } from "../resources.ts";
import type { ReplayArtifact, ReplayStatus } from "../runtime-types.ts";
import { evidenceReplayersDir, readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { slug, truncateMiddle } from "../text.ts";
import { buildReplayer, formatReplayer, refreshReplayDerivedFields } from "./build.ts";
import { appendEvidence, updateMissionCheckpoint } from "./deps.ts";
import { replayHash } from "./pure.ts";

export function writeReplayerArtifact(replay: ReplayArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceReplayersDir(),
		`${replay.timestamp.replace(/[:.]/g, "-")}-${slug(replay.route ?? "replayer")}-${replay.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Replayer Artifact",
			"",
			formatReplayer(replay, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(replay, null, 2),
			"```",
			"",
		].join("\n"),
	);
	appendEvidence({
		kind: replay.mode === "run" ? "runtime" : "artifact",
		title: `replayer-${replay.mode} ${replay.missionId ?? "no-mission"}`,
		fact: `Replay ${replay.mode}: ${replay.executions.length} executed, passed=${replay.passed}, failed=${replay.failed}, blocked=${replay.blocked.length}, operator_feedback=${(replay.operatorFeedback ?? []).length}`,
		command: `re_replayer ${replay.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "compiler repro command replay matrix",
	});
	if (replay.mode === "run") {
		updateMissionCheckpoint("replay_ready", replay.executions.length ? "done" : "blocked", path);
	} else if ((replay.steps?.length ?? 0) > 0) {
		// Plan with concrete replay steps is enough for queue readiness; run upgrades evidence.
		updateMissionCheckpoint("replay_ready", "done", path);
	}
	appendRuntimeFailureRepairFromReplay(replay, path);
	appendReplayerMemoryEvent(replay, path);
	return path;
}

export async function runReplayer(
	pi: any,
	options: { target?: string; maxSteps?: number; timeoutMs?: number } = {},
): Promise<string> {
	let replay = buildReplayer({ target: options.target, mode: "run" });
	const maxSteps = Math.max(1, Math.min(20, Math.floor(options.maxSteps ?? 3)));
	const timeout = Math.max(1000, Math.min(300000, Math.floor(options.timeoutMs ?? 60000)));
	for (const step of replay.steps.filter((item: any) => item.status === "ready").slice(0, maxSteps)) {
		const result = await pi.exec("bash", ["-lc", `set -o pipefail\n${step.command}`], { timeout });
		const status: ReplayStatus = result.code === 0 && !result.killed ? "passed" : "failed";
		step.status = status;
		step.reason = status === "failed" ? `exit=${result.code}${result.killed ? " killed=true" : ""}` : undefined;
		replay.executions.push({
			stepId: step.id,
			command: step.command,
			status,
			exit: result.code,
			killed: result.killed,
			stdoutHash: replayHash(result.stdout),
			stderrHash: replayHash(result.stderr),
			stdoutHead: truncateMiddle(result.stdout.trim(), 1200),
			stderrHead: truncateMiddle(result.stderr.trim(), 1200),
		});
	}
	replay = refreshReplayDerivedFields(replay);
	const path = writeReplayerArtifact(replay);
	return formatReplayer(replay, path);
}

export function parseReplayArtifact(path: string): ReplayArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as ReplayArtifact;
	} catch {
		return undefined;
	}
}

export function latestReplayerArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return (latestScopedMarkdownArtifact as any)("replayer", evidenceReplayersDir(), options);
}

export function buildReplayerOutput(action: "plan" | "show" = "plan", options: { target?: string } = {}): string {
	if (action === "show") {
		const path = latestReplayerArtifactPath();
		if (!path) return "replay_matrix:\nstatus: missing\nnext: re_replayer plan";
		return truncateMiddle(readText(path), 20000);
	}
	const replay = buildReplayer({ target: options.target, mode: "plan" });
	const path = writeReplayerArtifact(replay);
	return formatReplayer(replay, path);
}
