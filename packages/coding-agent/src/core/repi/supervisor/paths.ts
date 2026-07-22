/** Supervisor artifact path/parse helpers. */
import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { evidenceSupervisorsDir, readTextFile as readText } from "../storage.ts";
import { latestScopedMarkdownArtifact } from "./deps.ts";
import type { SupervisorArtifact } from "./types.ts";

export function latestSupervisorArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("supervisor", evidenceSupervisorsDir(), options);
}

export function parseSupervisorArtifact(path: string): SupervisorArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as SupervisorArtifact;
	} catch {
		return undefined;
	}
}
