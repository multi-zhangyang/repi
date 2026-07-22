/** Evidence streaming line-count helpers. */
import { closeSync, openSync, readSync, statSync } from "node:fs";
import { EVIDENCE_IO_CHUNK_SIZE } from "./io-read.ts";

// Streaming non-whitespace line count — avoids OOM on multi-GB evidence artifacts.
export function lineCountStreaming(path: string): number {
	const stat = statSync(path);
	if (stat.size === 0) return 0;
	const fd = openSync(path, "r");
	try {
		const buf = Buffer.alloc(EVIDENCE_IO_CHUNK_SIZE);
		let pos = 0;
		let count = 0;
		let lineHasNonWs = false;
		while (pos < stat.size) {
			const n = readSync(fd, buf, 0, Math.min(EVIDENCE_IO_CHUNK_SIZE, stat.size - pos), pos);
			if (n <= 0) break;
			for (let i = 0; i < n; i++) {
				const b = buf[i];
				if (b === 0x0a) {
					if (lineHasNonWs) count++;
					lineHasNonWs = false;
				} else if (b === 0x09 || b === 0x0b || b === 0x0c || b === 0x0d || b === 0x20) {
				} else {
					lineHasNonWs = true;
				}
			}
			pos += n;
		}
		if (lineHasNonWs) count++;
		return count;
	} finally {
		try {
			closeSync(fd);
		} catch {
			// Best-effort: fd may already be invalid.
		}
	}
}

export function lineCount(path: string): number {
	try {
		return lineCountStreaming(path);
	} catch {
		return 0;
	}
}
