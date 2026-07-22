/** Update compaction resume telemetry from executions. */
import { createHash } from "node:crypto";
import { normalizeReconCommand } from "./deps.ts";
import { missionCheckStatusLines, reconCommandMatches } from "./telemetry-format.ts";
import { latestReconCompactionResumeTelemetry, writeReconCompactionResumeTelemetry } from "./telemetry-io.ts";
import {
	applyCompactResumeTelemetryTransitions,
	markReverseCaptureTelemetryProgress,
} from "./telemetry-update-transitions.ts";
import type { ReconCompactionResumeTelemetry } from "./types.ts";

type OperationExecution = any;

export function updateReconCompactionTelemetryFromExecutions(
	executionsList: OperationExecution[],
	sourceArtifacts: string[] = [],
): ReconCompactionResumeTelemetry | undefined {
	const latest = latestReconCompactionResumeTelemetry();
	const current = latest.telemetry;
	if (!current) return undefined;
	const executions = new Map(executionsList.map((item: any) => [normalizeReconCommand(item.command), item]));
	let commandStatus = current.commandStatus.map((row: any) => {
		const execution =
			executions.get(normalizeReconCommand(row.command)) ??
			executionsList.find((item: any) => reconCommandMatches(row.command, item.command));
		if (!execution) return row;
		const enteredProofLoop =
			row.enteredProofLoop ||
			/^re[-_]proof[-_]loop\s+run\b/i.test(execution.command) ||
			/\bproof_loop:/i.test(execution.output);
		return {
			...row,
			status: execution.status === "blocked" ? ("blocked" as const) : ("done" as const),
			enteredProofLoop,
			outputSha256: createHash("sha256").update(execution.output).digest("hex"),
		};
	});
	const proofLoopEnteredByCurrentRun =
		commandStatus.some((row: any) => row.enteredProofLoop) ||
		executionsList.some(
			(item: any) =>
				item.status !== "blocked" &&
				(/^re[-_]proof[-_]loop\s+run\b/i.test(item.command) ||
					/\bcompact resume proof loop entered\b|\bproof_loop:/i.test(item.output)),
		);
	if (current.contractVerified && current.autoResumeTriggered && proofLoopEnteredByCurrentRun) {
		commandStatus = commandStatus.map((row: any) => ({
			...row,
			status: "done",
			enteredProofLoop: row.enteredProofLoop || /^re[-_]proof[-_]loop\s+run\b/i.test(row.command),
		}));
	}
	const telemetry: ReconCompactionResumeTelemetry = {
		...current,
		timestamp: new Date().toISOString(),
		commandStatus,
		checkStatus: missionCheckStatusLines(),
		proofLoopEntered: commandStatus.some((row: any) => row.enteredProofLoop),
		sourceArtifacts: Array.from(
			new Set([...current.sourceArtifacts, ...sourceArtifacts].filter(Boolean) as string[]),
		).slice(0, 40),
	};
	const telemetryIdempotencyKey = createHash("sha256")
		.update(
			[
				current.compactionEntryId ?? "",
				current.contextPath ?? "",
				current.commandStatus.map((row: any) => row.command).join("\n"),
			].join("\n"),
		)
		.digest("hex");
	applyCompactResumeTelemetryTransitions({
		telemetry,
		commandStatus,
		telemetryIdempotencyKey,
		contextPath: current.contextPath,
	});
	markReverseCaptureTelemetryProgress(telemetry as any, commandStatus);
	writeReconCompactionResumeTelemetry(telemetry);
	return telemetry;
}
