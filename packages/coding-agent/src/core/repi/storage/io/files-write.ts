/** Private file read/write helpers. */
import { appendFileSync, chmodSync, closeSync, openSync, readSync, statSync } from "node:fs";
import { atomicWriteFileSync } from "../../../tools/atomic-write.ts";
import { readTextFile } from "./files-read.ts";

export function chmodPrivate(path: string, mode: number): void {
	try {
		chmodSync(path, mode);
	} catch {
		// Best-effort on non-POSIX filesystems.
	}
}

export function writePrivateTextFile(path: string, content: string): void {
	// Atomic temp+rename (mode 0o600): shared write path for REPI persisted state.
	// Crash mid-write cannot leave truncated playbook/mission/evidence.
	atomicWriteFileSync(path, content, 0o600);
	chmodPrivate(path, 0o600);
}

export function appendPrivateTextFile(path: string, text: string): void {
	// True append (O(chunk)) instead of full-file read-modify-write.
	// Newline-separator contract: prepend "\n" unless existing content ends with "\n"
	// (including missing/empty files — matches historical leading-blank-line behavior).
	let prefix = "\n";
	try {
		const size = statSync(path).size;
		if (size > 0) {
			const fd = openSync(path, "r");
			try {
				const buf = Buffer.alloc(1);
				if (readSync(fd, buf, 0, 1, size - 1) > 0 && buf[0] === 0x0a) prefix = "";
			} finally {
				closeSync(fd);
			}
		}
	} catch {
		// missing/unreadable → keep prefix "\n"
	}
	try {
		appendFileSync(path, `${prefix}${text}`, { encoding: "utf8", mode: 0o600 });
		return;
	} catch {
		// Fall through to atomic read-modify-write fallback.
	}
	const current = readTextFile(path);
	writePrivateTextFile(path, `${current}${current.endsWith("\n") ? "" : "\n"}${text}`);
}
