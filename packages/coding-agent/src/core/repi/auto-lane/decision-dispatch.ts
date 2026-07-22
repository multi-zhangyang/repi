/** Auto-lane specialist dispatch with reverse proof gate. */

import { createAgentThreadManager } from "../../agent-thread-manager.ts";
import { laneSpec, type MissionLane, type MissionState } from "../mission.ts";
import { buildPentestingTaskTreeSnapshot } from "../pentesting-task-tree.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { envBoolean } from "../text.ts";
import { parsePlannerDecision } from "./decision-parse.ts";
import type { RunAutoDecision } from "./types.ts";

/**
 * Opt-in specialist dispatch: hand the active lane to the real specialist
 * subagent that owns it (laneSpec → reverser/explorer/operator/verifier) via
 * the real AgentThreadManager, then parse the merge handoff as the lane
 * decision. Returns undefined when no specialist owns the lane (caller falls
 * back to the inline command-pack path).
 */
export async function dispatchLaneSpecialist(options: {
	cwd: string;
	lane: MissionLane;
	mission: MissionState;
	target?: string;
}): Promise<{ text: string; decision: RunAutoDecision; spec: string; note: string } | undefined> {
	if (envBoolean("REPI_AGENT_THREAD")) return undefined;
	const spec = laneSpec(options.lane, options.mission.route);
	if (!spec) return undefined;
	const snapshot = buildPentestingTaskTreeSnapshot({ target: options.target });
	const reversePrompt = /reverse|native|malware|firmware|pwn|binary|reverser/i.test(
		`${spec} ${options.lane.name} ${options.lane.objective}`,
	)
		? "Reverse/product proof gate: if this lane is reverse/native/malware/pwn/firmware oriented, every technique claim requires runtime proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready before claim/release."
		: "";
	const task = [
		`You are the REPI ${spec} specialist. Own this mission lane end to end using your doctrine.`,
		`Lane: ${options.lane.name}`,
		`Objective: ${options.lane.objective}`,
		`Next steps queued: ${options.lane.next.join(", ") || "none"}`,
		options.target ? `Target: ${options.target}` : "",
		"Produce concrete evidence (commands run + output, offsets, artifact refs). Write your handoff to $REPI_WORKER_HANDOFF_PATH as your last action.",
		"Then emit a one-line decision for the autopilot loop:",
		"action: continue_current | continue_next | stop",
		"nextLane: <lane name or none>",
		"reason: <one line>",
		reversePrompt,
		"",
		"## PTT snapshot",
		snapshot.text,
	]
		.filter(Boolean)
		.join("\n");
	const mgr = createAgentThreadManager({ cwd: options.cwd });
	const timeoutMs = spec === "reverser" ? 360000 : 240000;
	const started = await mgr.spawnThread({ specName: spec, task, timeoutMs, inheritMcp: true });
	await mgr.awaitRun(started.runId);
	const merge = mgr.mergeRun(started.runId);
	const mergeText = merge?.text ?? "";
	const decision = parsePlannerDecision(mergeText);
	const reverseHeavy = /reverse|native|malware|firmware|pwn|binary|reverser/i.test(
		`${spec} ${options.lane.name} ${options.lane.objective} ${mergeText}`,
	);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${spec} ${options.lane.name} ${options.lane.objective}`,
				target: options.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	const noteBase = reverseHeavy
		? `specialist_dispatch: spec=${spec} status=${merge?.manifest.status ?? "unknown"} reverse_proof_gate=require_proof_exit_before_claim`
		: `specialist_dispatch: spec=${spec} status=${merge?.manifest.status ?? "unknown"}`;
	const note = reverseNext.length
		? `${noteBase}\nreverse_next:\n${reverseNext.map((c: any) => `- ${c}`).join("\n")}`
		: noteBase;
	return { text: mergeText, decision, spec, note };
}
