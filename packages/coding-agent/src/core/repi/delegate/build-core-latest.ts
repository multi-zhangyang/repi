import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { evidenceDelegationsDir } from "../storage.ts";
import { latestScopedMarkdownArtifact } from "./deps.ts";

export function latestDelegateArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("delegation", evidenceDelegationsDir(), options);
}
