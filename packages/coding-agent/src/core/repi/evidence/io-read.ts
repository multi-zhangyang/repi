/** Evidence bounded text read helpers. */

import { closeSync, openSync, readFileSync, readSync, statSync } from "node:fs";
import process from "node:process";

const DEFAULT_READ_TEXT_FILE_MAX_BYTES = 16 * 1024 * 1024;
const EVIDENCE_IO_CHUNK_SIZE = 1024 * 1024;

export function resolveReadTextFileMaxBytes(): number {
	const raw = process.env.REPI_READ_TEXT_FILE_MAX_BYTES;
	if (raw !== undefined && raw.trim() !== "") {
		const parsed = Number(raw);
		if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
	}
	return DEFAULT_READ_TEXT_FILE_MAX_BYTES;
}

export function readBoundedTail(path: string, size: number, cap: number): string {
	const tailLen = Math.min(cap, size);
	const fd = openSync(path, "r");
	try {
		const buf = Buffer.alloc(tailLen);
		const start = size - tailLen;
		let pos = 0;
		while (pos < tailLen) {
			const n = readSync(fd, buf, pos, Math.min(EVIDENCE_IO_CHUNK_SIZE, tailLen - pos), start + pos);
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
			// Best-effort: fd may already be invalid.
		}
	}
}

export function readTextFile(path: string, fallback = ""): string {
	try {
		const size = statSync(path).size;
		const cap = resolveReadTextFileMaxBytes();
		if (cap > 0 && size > cap) {
			return readBoundedTail(path, size, cap);
		}
		return readFileSync(path, "utf-8");
	} catch {
		return fallback;
	}
}

export { EVIDENCE_IO_CHUNK_SIZE };
