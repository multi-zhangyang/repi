/** Compaction resume telemetry format/parse/helpers. */

import { readTextFile as readText } from "../storage.ts";
import { escapeRegExp, shellQuote } from "../target.ts";
import { truncateMiddle } from "../text.ts";
import { normalizeReconCommand, readCurrentMission } from "./deps.ts";
import type { ReconCompactionResumeTelemetry } from "./types.ts";

export function formatReconCompactionResumeTelemetry(telemetry: ReconCompactionResumeTelemetry): string[] {
	return [
		`kind=${telemetry.kind} triggered=${telemetry.autoResumeTriggered} contract_verified=${telemetry.contractVerified} proof_loop_entered=${telemetry.proofLoopEntered} context_path=${telemetry.contextPath ?? "none"}`,
		...telemetry.commandStatus.map((row: any) =>
			[
				"compact_resume_command",
				`status=${row.status}`,
				`proof_loop=${row.enteredProofLoop}`,
				row.outputSha256 ? `output_sha256=${row.outputSha256}` : undefined,
				`command=${shellQuote(row.command)}`,
			]
				.filter(Boolean)
				.join(" "),
		),
		...telemetry.checkStatus.map((checkpoint: any) => `compact_resume_check ${checkpoint}`),
	].slice(0, 80);
}

export function parseReconCompactionResumeTelemetry(path: string): ReconCompactionResumeTelemetry | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		const parsed = JSON.parse(match[1]) as ReconCompactionResumeTelemetry;
		return parsed.kind === "repi-compaction-resume-telemetry" ? parsed : undefined;
	} catch {
		return undefined;
	}
}

export function missionCheckStatusLines(): string[] {
	const mission = readCurrentMission();
	return (
		mission?.checkpoints.map(
			(checkpoint: any) =>
				`${checkpoint.name}=${checkpoint.status}${checkpoint.note ? `:${truncateMiddle(checkpoint.note, 160)}` : ""}`,
		) ?? ["mission=missing"]
	);
}

export function reconCommandMatches(expected: string, actual: string): boolean {
	const normalizedExpected = normalizeReconCommand(expected);
	const normalizedActual = normalizeReconCommand(actual);
	if (normalizedExpected === normalizedActual) return true;
	const wildcardPattern = escapeRegExp(normalizedExpected).replace(/<target>|<TARGET>|<URL>|<none>/g, ".+?");
	return new RegExp(`^${wildcardPattern}$`, "i").test(normalizedActual);
}
