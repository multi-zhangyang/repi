/** Knowledge-graph latest path. */
import type { ArtifactScopeFilterOptions } from "../artifact-scope-types.ts";
import { evidenceKnowledgeDir } from "../storage.ts";
import { latestScopedMarkdownArtifact } from "./deps.ts";

export function latestKnowledgeGraphArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("knowledge", evidenceKnowledgeDir(), options);
}
