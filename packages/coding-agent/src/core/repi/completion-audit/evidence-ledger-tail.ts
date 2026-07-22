/** Read last N bytes of evidence ledger for reverse completion audit. */
import { closeSync, openSync, readSync, statSync } from "node:fs";
import { evidenceLedgerPath, readTextFile } from "../storage.ts";

const EVIDENCE_AUDIT_TAIL_BYTES = 256 * 1024;

export function readEvidenceLedgerTail(path = evidenceLedgerPath()): string {
	try {
		const size = statSync(path).size;
		if (size <= EVIDENCE_AUDIT_TAIL_BYTES) return readTextFile(path).trim();
		const fd = openSync(path, "r");
		try {
			const buf = Buffer.alloc(EVIDENCE_AUDIT_TAIL_BYTES);
			const start = size - EVIDENCE_AUDIT_TAIL_BYTES;
			let pos = 0;
			while (pos < EVIDENCE_AUDIT_TAIL_BYTES) {
				const n = readSync(fd, buf, pos, Math.min(1024 * 1024, EVIDENCE_AUDIT_TAIL_BYTES - pos), start + pos);
				if (n <= 0) break;
				pos += n;
			}
			return buf.subarray(0, pos).toString("utf-8").trim();
		} finally {
			try {
				closeSync(fd);
			} catch {
				/* best-effort */
			}
		}
	} catch {
		return readTextFile(path).trim();
	}
}
