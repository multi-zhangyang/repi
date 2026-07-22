/** REPI journal rotation / tail-cap / archive helpers. */
import { existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { memoryPath } from "./memory-stubs.ts";
import { artifactBasename, readTextFile as readText, reconDir, writePrivateTextFile } from "./storage.ts";

function runtimeJournalMaxRecords(): number {
	const raw = process.env.REPI_JOURNAL_MAX_RECORDS;
	if (raw === undefined) return 500;
	const n = Math.floor(Number(raw));
	return Number.isFinite(n) && n >= 0 ? n : 500;
}

export function rotateRuntimeMemoryJournalsIfNeeded(): void {
	const maxRecords = runtimeJournalMaxRecords();
	if (maxRecords <= 0) return;
	tailCapMarkdownBlockLedger(memoryPath("field-journal.md"), maxRecords);
	tailCapMarkdownBlockLedger(memoryPath("evolution-log.md"), maxRecords);
	rotateRuntimeCaseIndexJournalIfNeeded();
}

export function rotateRuntimeCaseIndexJournalIfNeeded(): void {
	const maxRecords = runtimeJournalMaxRecords();
	if (maxRecords <= 0) return;
	const text = readText(memoryPath("case-index.md"));
	if (!text.trim()) return;
	const lines = text.split(/\r?\n/);
	// Preserve the preamble: leading lines before the first `- ` record (the
	// `# REPI Case Index` header + blank line).
	let firstRecord = -1;
	for (let i = 0; i < lines.length; i++) {
		if (/^-\s/.test(lines[i] ?? "")) {
			firstRecord = i;
			break;
		}
	}
	if (firstRecord === -1) return; // no records yet
	const preamble = lines.slice(0, firstRecord);
	const records = lines.slice(firstRecord).filter((line: any) => line.trim() && /^-\s/.test(line));
	if (records.length <= maxRecords) return;
	const kept = records.slice(-maxRecords);
	writePrivateTextFile(memoryPath("case-index.md"), `${preamble.join("\n")}\n${kept.join("\n")}\n`);
}

// Rotate the field-journal + evolution-log (both `## `-headered block ledgers)
// and the case-index (line ledger). Companion to the evidence-ledger rotation
// (#57): the three memory journals are append-only markdown audit logs appended
// via the shared read-modify-write appendText on every appendJournal /
// appendEvolution call, read per-recall via truncateMiddle / slice(-5), with no
// per-record semantics / no hash chain → tail-capping is behavior-preserving.
// REPI_JOURNAL_MAX_RECORDS (default 500, 0 = disable) bounds all three.

export function tailCapMarkdownBlockLedger(path: string, maxRecords: number): void {
	if (maxRecords <= 0) return;
	const text = readText(path);
	if (!text.trim()) return;
	const firstHeader = text.search(/^##\s/m);
	if (firstHeader === -1) return; // no records yet
	const preamble = firstHeader > 0 ? text.slice(0, firstHeader) : "";
	const body = text.slice(firstHeader);
	// Split on the `## ` record header. The first element is the empty slot before
	// the first record; drop it. Each surviving element is the record body with the
	// `## ` prefix consumed by the split, so re-prepend it.
	const records = body
		.split(/^##\s/m)
		.map((r: any) => r.replace(/^\n+/, ""))
		.filter((r: any) => r.trim());
	if (records.length <= maxRecords) return;
	const kept = records.slice(-maxRecords);
	writePrivateTextFile(path, `${preamble}${kept.map((r: any) => `## ${r}`).join("\n\n")}\n`);
}

// Cap the on-disk evidence ledger (evidence/ledger.md) to its tail so the
// append-only markdown audit log does not grow unbounded across sessions. The
// ledger has NO per-record count semantics and NO hash chain — readers
// (buildEvidenceDigest/evidenceLedgerGraphNodes) already truncate to a tail
// window or slice(-limit), so dropping old records changes neither what the
// model sees nor any decision — only the on-disk audit window + the O(n)
// read-modify-write cost per append (appendText = appendPrivateTextFile reads
// the whole file then atomic-rewrites it) shrink. Same class as the failure
// ledger (#53) + repair queue (#56) rotations.

export function archiveReconFileIfExists(path: string, archiveRoot: string, archived: string[]): void {
	try {
		if (!existsSync(path)) return;
		const relative = path.startsWith(reconDir()) ? path.slice(reconDir().length + 1) : artifactBasename(path);
		const target = join(archiveRoot, relative);
		mkdirSync(dirname(target), { recursive: true });
		renameSync(path, target);
		archived.push(`${path} -> ${target}`);
	} catch (error) {
		archived.push(`${path} -> archive_failed:${String(error).slice(0, 180)}`);
	}
}

/**
 * Route-aware real-path defaults for the autopilot/swarm. Out of the box REPI
 * now favors real specialists (dispatch=specialist), the LLM step-planner
 * (reasoning=llm), and the real process-isolated swarm (execution=real) — the
 * auth/handoff/timeout blockers that previously made these unsafe are cleared.
 * Set REPI_AUTOMODE_LEGACY=1 to revert to the deterministic mechanical path
 * (regex/inline/simulated) for cost-controlled or deterministic runs. The real
 * paths are still cwd-gated and recursion-bound, so worker threads and
 * ctx-less direct tool calls (tests) keep falling back to the inline path.
 */
