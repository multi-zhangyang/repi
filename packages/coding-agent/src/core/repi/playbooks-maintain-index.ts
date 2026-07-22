/** Write playbook maintenance index markdown. */
import { join } from "node:path";
import type { PlaybookIndexEntry } from "./playbooks-deps.ts";
import { memoryPlaybooksDir, writePrivateTextFile } from "./storage.ts";

export function writePlaybookMaintenanceIndex(params: {
	active: PlaybookIndexEntry[];
	archived: PlaybookIndexEntry[];
	minQuality: number;
	maxActive: number;
	maxAgeDays: number;
	archive: boolean;
}): string {
	const indexPath = join(memoryPlaybooksDir(), "index.md");
	// Atomic temp+rename (writePrivateTextFile, 0o600) — a crash mid-write leaves
	// either the complete prior or complete new index, not a truncated one. Recall
	// reads this via readText which swallows failure → "" (silently no playbooks).
	writePrivateTextFile(
		indexPath,
		[
			"# REPI Playbook Index",
			"",
			`Generated: ${new Date().toISOString()}`,
			`Policy: minQuality=${params.minQuality}, maxActive=${params.maxActive}, maxAgeDays=${params.maxAgeDays}, archive=${params.archive}`,
			"",
			"| Status | Quality | AgeDays | Route | Lane | Target | File | Reason |",
			"|---|---:|---:|---|---|---|---|---|",
			...[...params.active, ...params.archived]
				.map((entry: any) =>
					[
						entry.status,
						String(entry.quality),
						String(entry.ageDays),
						entry.route,
						entry.lane,
						entry.target,
						entry.path,
						entry.reason ?? "",
					].join(" | "),
				)
				.map((line: any) => `| ${line} |`),
			"",
		].join("\n"),
	);
	return indexPath;
}
