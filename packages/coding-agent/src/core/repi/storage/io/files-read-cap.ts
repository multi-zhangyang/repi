/** Read text file byte-cap helpers. */
const DEFAULT_READ_TEXT_FILE_MAX_BYTES = 16 * 1024 * 1024;

// Dedup set of paths already flagged as over-cap this session, so the hot
// recall path (readTextFileCached on events.jsonl runs multiple times per tool
// result) does not spam stderr for the same oversized file.
const overCapWarnedPaths = new Set<string>();

export function resolveReadTextFileMaxBytes(): number {
	const raw = process.env.REPI_READ_TEXT_FILE_MAX_BYTES;
	if (raw !== undefined && raw.trim() !== "") {
		const parsed = Number(raw);
		if (Number.isFinite(parsed) && parsed >= 0) return Math.floor(parsed);
	}
	return DEFAULT_READ_TEXT_FILE_MAX_BYTES;
}

export function warnOverCap(path: string, size: number, cap: number): void {
	if (overCapWarnedPaths.has(path)) return;
	overCapWarnedPaths.add(path);
	// NOT a silent drop: a truncated ledger/note is observable here. The
	// missing/unreadable case stays silent per the existing catch contract.
	process.stderr.write(
		`repi: readTextFile "${path}" is ${size} bytes > cap ${cap} (REPI_READ_TEXT_FILE_MAX_BYTES); returning fallback, content not loaded\n`,
	);
}
