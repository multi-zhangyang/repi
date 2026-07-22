/** Playbook metrics, quality, and archive helpers. */
import { existsSync, mkdirSync, readdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { memoryPlaybooksArchiveDir, memoryPlaybooksDir } from "./storage.ts";
import { interestingLines, metadataValue, numericMetadataValue, uniqueMatches } from "./text.ts";

export function playbookBashBlocks(text: string): string[] {
	const blocks: string[] = [];
	for (const match of text.matchAll(/```(?:bash|sh)\n([\s\S]*?)```/g)) {
		const body = match[1]?.trim();
		if (body) blocks.push(body);
	}
	return blocks;
}

export function runAutoPlaybookMetrics(
	outputs: string[],
	stopReason: string,
): {
	qualityScore: number;
	artifactCount: number;
	autoAdvanceCount: number;
	followupCount: number;
	signalCount: number;
	failureCount: number;
} {
	const transcript = outputs.join("\n");
	const artifactCount = uniqueMatches(transcript, /^evidence_artifact:\s*(.+)$/gm, 50).length;
	const autoAdvanceCount = interestingLines(transcript, /auto_lane_update: .* -> /, 50).length;
	const followupCount = interestingLines(transcript, /followup_commands:|\[auto:/, 80).length;
	const signalCount = interestingLines(
		transcript,
		/comparison\/verification anchors|address anchors|route\/auth anchors|JS runtime\/signing anchors|Android anti-analysis|binary format\/mitigation|interesting output lines/i,
		80,
	).length;
	const failureCount = interestingLines(
		transcript,
		/command-pack exited nonzero|tool\/target\/runtime error|no high-signal anchors parsed|exit:\s*[1-9]\d*/i,
		80,
	).length;
	const stopBonus = stopReason.startsWith("no_auto_commands") ? 2 : 0;
	const qualityScore = Math.max(
		0,
		Math.min(
			100,
			artifactCount * 4 + autoAdvanceCount * 8 + followupCount * 2 + signalCount * 4 + stopBonus - failureCount * 8,
		),
	);
	return { qualityScore, artifactCount, autoAdvanceCount, followupCount, signalCount, failureCount };
}

export function playbookQualityScore(text: string): number {
	const explicit = numericMetadataValue(text, "quality_score");
	if (explicit !== undefined) return explicit;
	return runAutoPlaybookMetrics([text], metadataValue(text, "stop_reason") ?? "unknown").qualityScore;
}

export function playbookTimestamp(text: string, file: string): string {
	const explicit = metadataValue(text, "timestamp");
	if (explicit && !Number.isNaN(Date.parse(explicit))) return explicit;
	const match = /^(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/.exec(file);
	if (match) return match[1]!.replace(/T(\d{2})-(\d{2})-(\d{2})/, "T$1:$2:$3Z");
	return new Date(0).toISOString();
}

export function playbookAgeDays(timestamp: string): number {
	const parsed = Date.parse(timestamp);
	if (Number.isNaN(parsed)) return Number.POSITIVE_INFINITY;
	return Math.max(0, Math.floor((Date.now() - parsed) / 86_400_000));
}

export function activePlaybookFiles(): string[] {
	try {
		return readdirSync(memoryPlaybooksDir())
			.filter((file: any) => file.endsWith(".md") && file !== "index.md")
			.sort()
			.reverse();
	} catch {
		return [];
	}
}

export function archivePlaybook(path: string, file: string): string {
	mkdirSync(memoryPlaybooksArchiveDir(), { recursive: true });
	let destination = join(memoryPlaybooksArchiveDir(), file);
	if (existsSync(destination)) {
		destination = join(memoryPlaybooksArchiveDir(), `${new Date().toISOString().replace(/[:.]/g, "-")}-${file}`);
	}
	renameSync(path, destination);
	return destination;
}
