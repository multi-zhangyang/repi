/** Auto-lane LLM decision prompt. */

import { createAgentThreadManager } from "../../agent-thread-manager.ts";
import type { MissionLane, MissionState } from "../mission.ts";
import { buildPentestingTaskTreeSnapshot } from "../pentesting-task-tree.ts";
import { truncateMiddle } from "../text.ts";
import { parsePlannerDecision } from "./decision-parse.ts";
import type { RunAutoDecision } from "./types.ts";

export async function llmLaneRunDecision(options: {
	cwd: string;
	text: string;
	lane: MissionLane;
	mission: MissionState | undefined;
	target?: string;
}): Promise<RunAutoDecision> {
	const snapshot = buildPentestingTaskTreeSnapshot({ target: options.target });
	const task = [
		"You are the REPI step-planner. Given the Pentesting Task Tree snapshot and the last lane-run transcript, decide the next action for the autopilot loop.",
		"Return exactly these lines and nothing else:",
		"action: continue_current | continue_next | stop",
		"nextLane: <lane name or none>",
		"verdict: strong | partial | weak",
		"quality: <integer 0-100>",
		"reason: <one line>",
		"Rules: continue_current = re-run the same lane with adjusted commands; continue_next = advance to a different lane (set nextLane); stop = no productive next step (tool-blocked, repeated failure, or objective met). Prefer stop over repeating a failing lane.",
		"Reverse/product proof gate: if PTT reverse proof anchors show missing domain_proof_exit or technique without runtime proof.exit=partial_runtime_capture|runtime_capture_strong, prefer continue_current / continue_next toward capture runners over claim/stop.",
		"",
		`active_lane: ${options.lane.name}`,
		"",
		"## PTT snapshot",
		snapshot.text,
		"",
		"## last lane-run transcript",
		truncateMiddle(options.text, 10000),
	].join("\n");
	const mgr = createAgentThreadManager({ cwd: options.cwd });
	const started = await mgr.spawnThread({ specName: "planner", task, timeoutMs: 180000, inheritMcp: true });
	await mgr.awaitRun(started.runId);
	const merge = mgr.mergeRun(started.runId);
	const mergeText = merge?.text ?? "";
	return parsePlannerDecision(mergeText);
}
