/** Decision-core path/format helpers. */

import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { evidenceDecisionsDir, readTextFile as readText } from "../storage.ts";
import { latestScopedMarkdownArtifact } from "./deps.ts";

export { formatDecisionCore } from "./build-format-text.ts";
export { writeDecisionCoreArtifact } from "./build-format-write.ts";

export function latestDecisionCoreArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("decision_core", evidenceDecisionsDir(), options);
}

export { readText };
