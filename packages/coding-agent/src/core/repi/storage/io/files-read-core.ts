/** Read text file helpers. */
import { readFileSync, statSync } from "node:fs";
import { resolveReadTextFileMaxBytes, warnOverCap } from "./files-read-cap.ts";

export function readTextFile(path: string, fallback = ""): string {
	try {
		const size = statSync(path).size;
		const cap = resolveReadTextFileMaxBytes();
		if (cap > 0 && size > cap) {
			warnOverCap(path, size, cap);
			return fallback;
		}
		return readFileSync(path, "utf-8");
	} catch {
		return fallback;
	}
}

const textFileCache = new Map<string, { mtimeMs: number; size: number; value: string }>();

/**
 * mtime+size-keyed cache of {@link readTextFile}, for hot-path readers of files
 * that are INVARIANT within a turn (or across many tool results) but read
 * repeatedly. Identical return contract to readTextFile: `fallback` (default "")
 * on any missing/unreadable path. The missing/unreadable case is NOT cached.
 */
export function readTextFileCached(path: string, fallback = ""): string {
	try {
		const stat = statSync(path);
		const mtimeMs = stat.mtimeMs;
		const size = stat.size;
		// opt #163 — same stat-first OOM guard as readTextFile.
		const cap = resolveReadTextFileMaxBytes();
		if (cap > 0 && size > cap) {
			warnOverCap(path, size, cap);
			return fallback;
		}
		const cached = textFileCache.get(path);
		if (cached && cached.mtimeMs === mtimeMs && cached.size === size) {
			return cached.value;
		}
		const value = readFileSync(path, "utf-8");
		textFileCache.set(path, { mtimeMs, size, value });
		return value;
	} catch {
		return fallback;
	}
}
