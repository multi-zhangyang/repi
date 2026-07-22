/** Read text file helpers. */
import { closeSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import { resolveReadTextFileMaxBytes, warnOverCap } from "./files-read-cap.ts";

const TAIL_CHUNK = 1024 * 1024;

function readBoundedTail(path: string, size: number, cap: number): string {
	const tailLen = Math.min(cap, size);
	const fd = openSync(path, "r");
	try {
		const buf = Buffer.alloc(tailLen);
		const start = size - tailLen;
		let pos = 0;
		while (pos < tailLen) {
			const n = readSync(fd, buf, pos, Math.min(TAIL_CHUNK, tailLen - pos), start + pos);
			if (n <= 0) break;
			pos += n;
		}
		const body = buf.subarray(0, pos).toString("utf-8");
		const dropped = size - pos;
		return `[truncated ${dropped} bytes from head, showing last ${pos} bytes of ${size}]\n${body}`;
	} finally {
		try {
			closeSync(fd);
		} catch {
			/* best-effort */
		}
	}
}

export function readTextFile(path: string, fallback = ""): string {
	try {
		const size = statSync(path).size;
		const cap = resolveReadTextFileMaxBytes();
		if (cap > 0 && size > cap) {
			warnOverCap(path, size, cap);
			return readBoundedTail(path, size, cap);
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
		const cap = resolveReadTextFileMaxBytes();
		if (cap > 0 && size > cap) {
			warnOverCap(path, size, cap);
			// Cap path is not cached as full body; re-read tail if mtime/size change.
			const cached = textFileCache.get(path);
			if (cached && cached.mtimeMs === mtimeMs && cached.size === size) return cached.value;
			const value = readBoundedTail(path, size, cap);
			textFileCache.set(path, { mtimeMs, size, value });
			return value;
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
