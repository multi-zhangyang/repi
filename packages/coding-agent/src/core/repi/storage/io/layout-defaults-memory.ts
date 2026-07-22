/** REPI storage default memory seed files — product memory subsystem removed. */
export function repiStorageMemoryDefaultEntries(
	_memoryEmbeddingProvider: Record<string, unknown>,
): Array<[string, string]> {
	// Do not create core/project/procedural memory journals or deposition ledgers.
	// Evidence / tool-trace / mission paths remain outside this seed.
	return [];
}
