/** JSON object file helpers. */
import { readFileSync, statSync } from "node:fs";

export function readJsonObjectFile<T>(path: string): T | undefined {
	try {
		return JSON.parse(readFileSync(path, "utf-8")) as T;
	} catch {
		return undefined;
	}
}

const jsonObjectFileCache = new Map<string, { mtimeMs: number; size: number; value: unknown }>();

/**
 * mtime+size-keyed cache of {@link readJsonObjectFile}.
 * Pays one stat(2) per call; re-reads + re-parses only when mtime/size change.
 * Identical return contract: undefined on missing/unreadable/invalid JSON.
 */
export function readJsonObjectFileCached<T>(path: string): T | undefined {
	try {
		const stat = statSync(path);
		const mtimeMs = stat.mtimeMs;
		const size = stat.size;
		const cached = jsonObjectFileCache.get(path);
		if (cached && cached.mtimeMs === mtimeMs && cached.size === size) {
			return cached.value as T | undefined;
		}
		const value = JSON.parse(readFileSync(path, "utf-8")) as T;
		jsonObjectFileCache.set(path, { mtimeMs, size, value });
		return value;
	} catch {
		return undefined;
	}
}
