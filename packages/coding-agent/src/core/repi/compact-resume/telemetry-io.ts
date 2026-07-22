/** Compaction resume telemetry path/read/write/init. */
import { ensureReconStorage } from "../resources.ts";
import { readTextFile as readText, writePrivateTextFile } from "../storage.ts";
import { interestingLines } from "../text.ts";
import { compactionResumeTelemetryPath, updateMissionCheckpoint } from "./deps.ts";
import {
	formatReconCompactionResumeTelemetry,
	missionCheckStatusLines,
	parseReconCompactionResumeTelemetry,
} from "./telemetry-format.ts";
import type {
	ReconCompactionAutoResume,
	ReconCompactionResumeContract,
	ReconCompactionResumeTelemetry,
} from "./types.ts";

export function latestReconCompactionResumeTelemetry(): {
	path: string;
	telemetry?: ReconCompactionResumeTelemetry;
	lines: string[];
} {
	const path = compactionResumeTelemetryPath();
	const telemetry = parseReconCompactionResumeTelemetry(path);
	return {
		path,
		telemetry,
		lines: telemetry
			? formatReconCompactionResumeTelemetry(telemetry)
			: interestingLines(readText(path), /compact_resume|proof_loop|re[-_]/i, 80),
	};
}

export function writeReconCompactionResumeTelemetry(telemetry: ReconCompactionResumeTelemetry): string {
	ensureReconStorage();
	const path = compactionResumeTelemetryPath();
	writePrivateTextFile(
		path,
		[
			"# REPI Compaction Auto Resume Board",
			"",
			`Updated: ${telemetry.timestamp}`,
			`Compaction entry: ${telemetry.compactionEntryId ?? "none"}`,
			`Context path: ${telemetry.contextPath ?? "none"}`,
			`Contract verified: ${telemetry.contractVerified}`,
			`Auto resume triggered: ${telemetry.autoResumeTriggered}`,
			`Proof loop entered: ${telemetry.proofLoopEntered}`,
			"",
			"## Telemetry",
			...formatReconCompactionResumeTelemetry(telemetry).map((item: any) => `- ${item}`),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(telemetry, null, 2),
			"```",
			"",
		].join("\n"),
	);
	updateMissionCheckpoint("compaction_auto_resume_telemetry_ready", "done", path);
	if (telemetry.proofLoopEntered) updateMissionCheckpoint("compaction_proof_resume_entered", "done", path);
	return path;
}

export function initialReconCompactionResumeTelemetry(
	contract: ReconCompactionResumeContract,
	autoResume: ReconCompactionAutoResume,
): ReconCompactionResumeTelemetry {
	return {
		kind: "repi-compaction-resume-telemetry",
		version: 1,
		timestamp: new Date().toISOString(),
		compactionEntryId: contract.compactionEntryId,
		contextPath: contract.contextPath,
		contractVerified: contract.verified,
		autoResumeTriggered: autoResume.triggered,
		commandStatus: Array.from(
			new Set(autoResume.resumeCommands.length ? autoResume.resumeCommands : contract.nextCommands),
		)
			.slice(0, 12)
			.map((command: any) => ({
				command,
				status: "queued",
				enteredProofLoop: /^re[-_]proof[-_]loop\s+run\b/i.test(command),
			})),
		checkStatus: missionCheckStatusLines(),
		proofLoopEntered: false,
		sourceArtifacts: Array.from(
			new Set([contract.contextPath, ...contract.sourceArtifacts].filter(Boolean) as string[]),
		).slice(0, 40),
	};
}
