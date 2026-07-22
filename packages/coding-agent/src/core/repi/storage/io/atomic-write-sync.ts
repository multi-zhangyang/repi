/** Sync atomic write for REPI state paths (temp+rename, orphan .tmp cleanup). */
import { randomBytes } from "node:crypto";
import { chmodSync, renameSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

/**
 * Write `content` to `path` atomically (temp in same dir + rename).
 * On any failure, best-effort unlink of the temp so no orphaned `.tmp` remains.
 * Mode defaults to 0o600 for new files; existing files preserve mode when possible.
 */
export function writeFileAtomic(path: string, content: string, mode = 0o600): void {
	let st: ReturnType<typeof statSync> | undefined;
	try {
		st = statSync(path);
	} catch {
		/* new file */
	}
	if (st?.isDirectory()) {
		throw new Error(`${path} is a directory, not a file.`);
	}
	const dir = dirname(path);
	const tempPath = join(dir, `.${basename(path)}.${process.pid}.${Date.now()}.${randomBytes(4).toString("hex")}.tmp`);
	try {
		writeFileSync(tempPath, content, { encoding: "utf8", mode });
		const finalMode = st && !st.isDirectory() ? Number(st.mode) & 0o777 : mode;
		try {
			chmodSync(tempPath, finalMode);
		} catch {
			/* best-effort */
		}
		renameSync(tempPath, path);
	} catch (error) {
		try {
			unlinkSync(tempPath);
		} catch {
			/* already gone */
		}
		throw error;
	}
}
