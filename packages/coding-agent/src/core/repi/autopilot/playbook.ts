/** Autopilot run-auto playbook writer. */
import { join } from "node:path";
import {
	appendEvolution,
	appendJournal,
	formatMission,
	uniqueMatches,
	updateMissionCheckpoint,
} from "../autopilot-deps.ts";
import { readCurrentMission } from "../mission.ts";
import { maintainPlaybooks, runAutoPlaybookMetrics } from "../playbooks.ts";
import { ensureReconStorage } from "../resources.ts";
import { memoryPlaybooksDir, writePrivateTextFile } from "../storage.ts";
import { interestingLines, slug, truncateMiddle } from "../text.ts";

export function writeRunAutoPlaybook(params: {
	requestedLane?: string;
	target?: string;
	maxSteps: number;
	stepsExecuted: number;
	stopReason: string;
	outputs: string[];
}): { path: string; journalAnchor: string; evolutionAnchor: string } {
	ensureReconStorage();
	const mission = readCurrentMission();
	const timestamp = new Date().toISOString();
	const artifacts = uniqueMatches(params.outputs.join("\n"), /^evidence_artifact:\s*(.+)$/gm, 20);
	const autoUpdates = interestingLines(
		params.outputs.join("\n"),
		/auto_lane_update:|next_lane_hint:|followup_commands:/,
		40,
	);
	const metrics = runAutoPlaybookMetrics(params.outputs, params.stopReason);
	const title = `${mission?.route.domain ?? "security"} ${params.requestedLane ?? "auto-chain"}`;
	const path = join(memoryPlaybooksDir(), `${timestamp.replace(/[:.]/g, "-")}-${slug(title)}.md`);
	const body = [
		"# REPI Auto Playbook",
		"",
		`timestamp: ${timestamp}`,
		`mission_id: ${mission?.id ?? "none"}`,
		`task: ${mission?.task ?? "unknown"}`,
		`route: ${mission?.route.domain ?? "unknown"}`,
		`requested_lane: ${params.requestedLane ?? "active"}`,
		`target: ${params.target ?? "<none>"}`,
		`max_steps: ${params.maxSteps}`,
		`steps_executed: ${params.stepsExecuted}`,
		`stop_reason: ${params.stopReason}`,
		`quality_score: ${metrics.qualityScore}`,
		`artifact_count: ${metrics.artifactCount}`,
		`auto_advance_count: ${metrics.autoAdvanceCount}`,
		`followup_count: ${metrics.followupCount}`,
		`signal_count: ${metrics.signalCount}`,
		`failure_count: ${metrics.failureCount}`,
		"",
		"## Evidence artifacts",
		"",
		...(artifacts.length > 0 ? artifacts.map((artifact: any) => `- ${artifact}`) : ["- none parsed"]),
		"",
		"## Auto lane updates / follow-ups",
		"",
		...(autoUpdates.length > 0
			? autoUpdates.map((line: any) => `- ${truncateMiddle(line, 500)}`)
			: ["- none parsed"]),
		"",
		"## Mission snapshot",
		"",
		"```",
		mission ? formatMission(mission) : "no mission",
		"```",
		"",
		"## Run transcript",
		"",
		truncateMiddle(params.outputs.join("\n\n"), 24000),
		"",
	].join("\n");
	// Atomic temp+rename (0o600): read back via readText by maintainPlaybooks;
	// a torn writeFileSync would mis-rank/archive with no error. #43/#103.
	writePrivateTextFile(path, body);
	const journalAnchor = appendJournal(
		"run-auto-playbook",
		title,
		[
			`playbook: ${path}`,
			`steps_executed=${params.stepsExecuted}; stop_reason=${params.stopReason}`,
			`quality_score=${metrics.qualityScore}; artifacts=${metrics.artifactCount}; advances=${metrics.autoAdvanceCount}; signals=${metrics.signalCount}; failures=${metrics.failureCount}`,
			artifacts.length ? `artifacts=${artifacts.join(", ")}` : "artifacts=none parsed",
			autoUpdates.length ? `auto_updates=${autoUpdates.slice(0, 8).join(" | ")}` : "auto_updates=none parsed",
		].join("\n"),
	);
	const evolutionAnchor = appendEvolution(
		`run-auto playbook ${mission?.route.domain ?? "security"}`,
		[
			`Promoted bounded run-auto chain into reusable playbook: ${path}`,
			`route=${mission?.route.domain ?? "unknown"} lane=${params.requestedLane ?? "active"} steps=${params.stepsExecuted}`,
			`quality_score=${metrics.qualityScore}; followups=${metrics.followupCount}; signals=${metrics.signalCount}; failures=${metrics.failureCount}`,
			"Reuse rule: when run_auto_summary has evidence artifacts and follow-up commands, search memory/playbooks before repeating manual triage.",
		].join("\n"),
	);
	updateMissionCheckpoint("memory_or_evolution_written", "done", path);
	maintainPlaybooks({ archive: true });
	return { path, journalAnchor, evolutionAnchor };
}
