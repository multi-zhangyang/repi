/** Context-pack optional memory artifact pairs (opt-in). */

import { repiMemorySettings } from "../memory-stubs.ts";
import { envBoolean } from "../text.ts";
import { fullContextMemoryPairs, leanContextMemoryPairs, RAW_MEMORY_ARTIFACT_KINDS } from "./memory-pairs-paths.ts";

export function buildContextMemoryPairs(options: { requestedBy?: string } = {}): Array<[string, string | undefined]> {
	// Memory subsystem removed from product surface. Context artifact index stays lean by default.
	// Opt-in: REPI_CONTEXT_MEMORY=1 or REPI_FULL_SURFACE=1.
	const memorySettings = repiMemorySettings();
	const contextMemoryOptIn = envBoolean("REPI_CONTEXT_MEMORY") === true || envBoolean("REPI_FULL_SURFACE") === true;
	const includeMemoryArtifacts =
		contextMemoryOptIn &&
		(Boolean(memorySettings.includeGlobalMemoryInContextPack) ||
			memorySettings.contextMemoryMode === "scoped" ||
			memorySettings.contextMemoryMode === "global" ||
			memorySettings.autoRecall === true ||
			/^re_memory_/i.test(options.requestedBy ?? "") ||
			/^re_note_/i.test(options.requestedBy ?? ""));
	const includeRawMemoryArtifacts =
		contextMemoryOptIn &&
		(Boolean(memorySettings.includeGlobalMemoryInContextPack) ||
			memorySettings.contextMemoryMode === "global" ||
			/^re_memory_/i.test(options.requestedBy ?? "") ||
			/^re_note_/i.test(options.requestedBy ?? ""));
	const memoryPairs = includeMemoryArtifacts ? fullContextMemoryPairs() : leanContextMemoryPairs();
	return memoryPairs.filter(([kind]) => includeRawMemoryArtifacts || !RAW_MEMORY_ARTIFACT_KINDS.has(kind));
}
