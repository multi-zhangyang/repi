/** Playbook maintain/archive scoring. */
// Landmark: maintainPlaybooks playbookScore reverse-heavy quality archive
import { join } from "node:path";
import { readTextFile as readText } from "./evidence.ts";
import type { PlaybookIndexEntry, PlaybookMaintenanceResult } from "./playbooks-deps.ts";
import {
	activePlaybookFiles,
	archivePlaybook,
	playbookAgeDays,
	playbookQualityScore,
	playbookTimestamp,
} from "./playbooks-metrics.ts";
import { ensureReconStorage } from "./resources.ts";
import { memoryPlaybooksDir } from "./storage.ts";
import { metadataValue } from "./text.ts";

export { playbookScore } from "./playbooks-maintain-score.ts";

import { writePlaybookMaintenanceIndex } from "./playbooks-maintain-index.ts";

export function maintainPlaybooks(options?: {
	archive?: boolean;
	minQuality?: number;
	maxActive?: number;
	maxAgeDays?: number;
}): PlaybookMaintenanceResult {
	ensureReconStorage();
	const minQuality = options?.minQuality ?? 6;
	const maxActive = options?.maxActive ?? 50;
	const maxAgeDays = options?.maxAgeDays ?? 120;
	const archive = options?.archive ?? false;
	const entries = activePlaybookFiles().map((file: any) => {
		const path = join(memoryPlaybooksDir(), file);
		const text = readText(path);
		const timestamp = playbookTimestamp(text, file);
		const quality = playbookQualityScore(text);
		const ageDays = playbookAgeDays(timestamp);
		return {
			file,
			path,
			route: metadataValue(text, "route") ?? "unknown",
			lane: metadataValue(text, "requested_lane") ?? "unknown",
			target: metadataValue(text, "target") ?? "<none>",
			timestamp,
			quality,
			ageDays,
			status: "active" as const,
		};
	});
	const ranked = [...entries].sort((a: any, b: any) => b.quality - a.quality || a.ageDays - b.ageDays);
	const active = new Set(ranked.slice(0, maxActive).map((entry: any) => entry.path));
	const resultActive: PlaybookIndexEntry[] = [];
	const archived: PlaybookIndexEntry[] = [];
	for (const entry of ranked) {
		let reason: string | undefined;
		if (entry.quality < minQuality) reason = `quality<${minQuality}`;
		else if (entry.ageDays > maxAgeDays && entry.quality < 25) reason = `age>${maxAgeDays}d-and-quality<25`;
		else if (!active.has(entry.path)) reason = `rank>${maxActive}`;
		if (reason && archive) {
			const archivedPath = archivePlaybook(entry.path, entry.file);
			archived.push({ ...entry, path: archivedPath, status: "archived", reason });
		} else if (reason) {
			resultActive.push({ ...entry, reason });
		} else {
			resultActive.push(entry);
		}
	}
	const indexPath = writePlaybookMaintenanceIndex({
		active: resultActive,
		archived,
		minQuality,
		maxActive,
		maxAgeDays,
		archive,
	});
	return { indexPath, active: resultActive, archived };
}
