/** Autopilot mission ensure + clean-state helpers. */

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { atomicWriteFileSync } from "../../tools/atomic-write.ts";
import { archiveReconFileIfExists } from "../journal.ts";
import type { MissionState } from "../mission.ts";
import { createMission, readCurrentMission, routeReconTask, writeCurrentMission } from "../mission.ts";
import { sanitizeMemoryText } from "../poison-sanitize.ts";
import { ensureReconStorage } from "../resources.ts";
import {
	compactResumeTransitionLedgerPath,
	currentMissionPath,
	memoryArtifactScopeFilterReportPath,
	memoryPath,
	memoryScopeIsolationReportPath,
	reconArchiveDir,
} from "../storage.ts";
import { sanitizeTargetForCommand } from "../target.ts";

export function ensureAutopilotMission(params: { task?: string; target?: string; cleanState?: boolean }): MissionState {
	const task =
		params.task?.trim() ||
		(readCurrentMission()?.task ?? `autopilot ${params.target ? `target ${params.target}` : "reverse/pentest task"}`);
	if (params.task || !readCurrentMission()) {
		return writeCurrentMission(createMission(task, routeReconTask(`${task} ${params.target ?? ""}`)));
	}
	return readCurrentMission()!;
}

export function prepareAutopilotCleanState(params: { target?: string; task?: string }): string[] {
	ensureReconStorage();
	const timestamp = new Date().toISOString();
	const archiveRoot = join(reconArchiveDir(), `autopilot-clean-state-${timestamp.replace(/[:.]/g, "-")}`);
	mkdirSync(archiveRoot, { recursive: true });
	const archived: string[] = [];
	for (const path of [
		currentMissionPath(),
		memoryPath("dispatcher-feedback-board.md"),
		memoryPath("compaction-auto-resume-board.md"),
		memoryPath("compaction-resume-ledger.jsonl"),
		compactResumeTransitionLedgerPath(),
		memoryScopeIsolationReportPath(),
		memoryArtifactScopeFilterReportPath(),
	]) {
		archiveReconFileIfExists(path, archiveRoot, archived);
	}
	// Atomic (opt #208): temp+rename 0o644 so a crash mid-write cannot leave a
	// truncated archive manifest.json that a later restore reads as partial.
	atomicWriteFileSync(
		join(archiveRoot, "manifest.json"),
		`${JSON.stringify(
			{
				kind: "repi-autopilot-clean-state-archive",
				generatedAt: timestamp,
				target: sanitizeTargetForCommand(params.target),
				task: sanitizeMemoryText(params.task),
				archived,
				policy:
					"archive volatile mission/context/dispatcher state; keep tool-index and immutable evidence available through scoped filters",
			},
			null,
			2,
		)}\n`,
		0o644,
	);
	ensureReconStorage();
	return [`archive_root=${archiveRoot}`, ...archived.slice(0, 16)];
}
