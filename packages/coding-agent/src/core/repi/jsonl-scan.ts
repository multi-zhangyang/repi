/** JSONL record scan helpers. */
import { readJsonlParsed } from "./jsonl-cache.ts";

export function jsonlRecords<T>(path: string, predicate: (value: unknown) => value is T): T[] {
	return readJsonlParsed(path, predicate, "").rows;
}

export function jsonlScan<T>(
	path: string,
	predicate: (value: unknown) => value is T,
	typeName: string,
): { rows: T[]; errors: string[]; raw: string } {
	return readJsonlParsed(path, predicate, typeName);
}

/**
 * opt #78 cache-warm helper. The #78 incremental post-commit verifier no longer
 * calls jsonlScan on the events/case files (that was the O(N) re-parse it eliminated),
 * but that jsonlScan had a second job: it WARMED the #74 parsed-rows cache (and, via
 * readTextFileCached, the #70 text cache) with the POST-append mtime+size+rows, so the
 * per-tool-result recall path that follows a deposit hit the cache (0 readFileSync, 0
 * JSON.parse). Without warming, the first recall after a deposit misses (1 read + 1
 * parse) — a regression in the #68/#70/#74 recall-read-amplification contract.
 *
 * This warms the parsed cache directly from rows + raw the caller already has in hand
 * (the preflight scan rows + the newly-appended row, the post-append text), stats the
 * file to capture the POST-append mtime+size, and records the entry — NO readFileSync,
 * NO JSON.parse. The recall path's jsonlRecords/jsonlScan then hits on (mtime+size,
 * predicate ref) and returns the shared rows without touching the text cache. Idempotent
 * with the full-walk fallback path (which warms via jsonlScan to the same post-append
 * mtime+rows), so calling it unconditionally at the append site is safe.
 */
/**
 * opt #83 — derived-value cache for JSONL-ledger reductions. Several recall-path helpers
 * (latestCaseMemoryBySignature, latestMemoryQualityByEvent, memoryBlockingGovernanceBySource)
 * build a Map/Set from a ledger's rows on EVERY call — O(rows) per call, called per
 * tool_result via searchMemoryEvents. The #74 parsed-rows cache already returns the SHARED
 * rows (0 readFileSync + 0 JSON.parse on a hit), but the derived Map was still rebuilt every
 * call. The Map is a PURE function of the rows, which only change when the ledger is rewritten
 * (deposit/governance/quality op, atomic temp+rename → mtime+size change). Cache the derived
 * value keyed by (path, mtime+size): on a hit return the cached value; on a miss call build()
 * (which reads #74-cached rows) and cache the result. Shared-reference safe — same precedent
 * as #65/#74/#76/#81: every consumer of these Maps reads row fields read-only (.get/.values,
 * no mutation of the Map or its row objects). A deposit bumps mtime → miss → rebuild + re-cache.
 * Missing files are NOT cached (stat throws → no store → next call re-stats), so an appearing
 * file is observed. Idempotent with direct builds. The build() closure MUST be a pure function
 * of the ledger rows (no side effects, no dependence on volatile state) — the cache assumes
 * equal (path, mtime+size) ⇒ equal derived value.
 */
