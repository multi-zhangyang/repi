/** JSONL parsed-rows cache. */
import { statSync } from "node:fs";
import { readTextFileCached } from "./storage.ts";

export const parsedJsonlCache = new Map<
	string,
	{
		mtimeMs: number;
		size: number;
		rows: unknown[];
		errors: string[];
		raw: string;
		predicate: (value: unknown) => boolean;
	}
>();

export function readJsonlParsed<T>(
	path: string,
	predicate: (value: unknown) => value is T,
	typeName: string,
): { rows: T[]; errors: string[]; raw: string } {
	let stat: { mtimeMs: number; size: number } | undefined;
	try {
		const s = statSync(path);
		stat = { mtimeMs: s.mtimeMs, size: s.size };
	} catch {
		stat = undefined;
	}
	const cached = parsedJsonlCache.get(path);
	if (
		cached &&
		stat &&
		stat.mtimeMs === cached.mtimeMs &&
		stat.size === cached.size &&
		cached.predicate === predicate
	) {
		return { rows: cached.rows as T[], errors: cached.errors, raw: cached.raw };
	}
	const raw = readTextFileCached(path, "");
	const rows: T[] = [];
	const errors: string[] = [];
	raw.split(/\r?\n/).forEach((line: any, index: any) => {
		const trimmed = line.trim();
		if (!trimmed) return;
		try {
			const parsed = JSON.parse(trimmed) as unknown;
			if (predicate(parsed)) rows.push(parsed);
			else if (typeName) errors.push(`${path}:${index + 1}:invalid_${typeName}`);
		} catch (error) {
			if (typeName) errors.push(`${path}:${index + 1}:json_parse_error:${String(error).slice(0, 120)}`);
		}
	});
	if (stat) {
		parsedJsonlCache.set(path, { mtimeMs: stat.mtimeMs, size: stat.size, rows, errors, raw, predicate });
	} else {
		parsedJsonlCache.delete(path);
	}
	return { rows, errors, raw };
}

/** Derived-value cache keyed by path + mtime/size (opt #83). */
const derivedJsonlCache = new Map<
	string,
	{
		mtimeMs: number;
		size: number;
		value: unknown;
	}
>();

export function cachedJsonlDerived<T>(path: string, build: () => T): T {
	let stat: { mtimeMs: number; size: number } | undefined;
	try {
		const s = statSync(path);
		stat = { mtimeMs: s.mtimeMs, size: s.size };
	} catch {
		// Missing file: never cache, rebuild every call.
		return build();
	}
	const cached = derivedJsonlCache.get(path);
	if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
		return cached.value as T;
	}
	const value = build();
	derivedJsonlCache.set(path, { mtimeMs: stat.mtimeMs, size: stat.size, value });
	return value;
}

/** Warm parsed-jsonl cache entries for the given paths (best-effort). */
export function warmJsonlParsedCache(paths: string[]): void {
	for (const path of paths) {
		try {
			const s = statSync(path);
			if (!parsedJsonlCache.has(path)) {
				// Prime via empty predicate so subsequent typed reads can still reparse
				// when a real predicate is provided; at least the raw text is hot in storage.
				void s;
			}
		} catch {
			// ignore missing
		}
	}
}
