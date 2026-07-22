/** Poison-sanitize text path inventory for recon cleanup. */

import { recentMarkdownArtifacts } from "../storage/io/artifacts.ts";
import { currentMissionPath, evidenceContextsDir, evidenceDecisionsDir, evidenceKernelDir } from "../storage.ts";
import { memoryPath } from "./config.ts";

export function poisonSanitizeTextPaths(): string[] {
	return [
		currentMissionPath(),
		memoryPath("dispatcher-feedback-board.md"),
		memoryPath("compaction-auto-resume-board.md"),
		...recentMarkdownArtifacts(evidenceKernelDir(), 12),
		...recentMarkdownArtifacts(evidenceDecisionsDir(), 12),
		...recentMarkdownArtifacts(evidenceContextsDir(), 12),
	];
}
