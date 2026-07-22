/** REPI journal append helpers. */

import { rotateRuntimeMemoryJournalsIfNeeded } from "./journal-rotate.ts";
import { memoryPath } from "./memory-stubs.ts";
import { ensureReconStorage } from "./resources.ts";
import { readTextFile as readText, writePrivateTextFile } from "./storage.ts";

function appendText(path: string, text: string): void {
	const prev = readText(path);
	const sep = prev && !prev.endsWith("\n") ? "\n" : "";
	writePrivateTextFile(path, prev ? `${prev}${sep}${text}` : text);
}

export function appendJournal(scene: string, title: string, body: string): string {
	ensureReconStorage();
	const date = new Date().toISOString().slice(0, 10);
	const anchor = `${date} — ${scene.trim() || "general"} — ${title.trim() || "field-note"}`;
	appendText(memoryPath("field-journal.md"), [`## ${anchor}`, "", body.trim(), ""].join("\n"));
	appendText(memoryPath("case-index.md"), `- ${date} ${scene} ${title} — keywords: ${scene},${title}\n`);
	// Tail-rotate the field-journal + case-index after append (companion to the
	// evidence-ledger rotation #57). Both are append-only markdown audit logs
	// (no hash chain / no per-record counts) read per-recall via truncateMiddle /
	// slice(-5), so capping is behavior-preserving. evolution-log is rotated in
	// appendEvolution. REPI_JOURNAL_MAX_RECORDS (default 500, 0 = disable).
	rotateRuntimeMemoryJournalsIfNeeded();
	return anchor;
}

export function appendEvolution(title: string, body: string): string {
	ensureReconStorage();
	const date = new Date().toISOString().slice(0, 10);
	const anchor = `${date} — ${title.trim() || "agent evolution"}`;
	appendText(memoryPath("evolution-log.md"), [`## ${anchor}`, "", body.trim(), ""].join("\n"));
	// Tail-rotate the evolution-log after append (same class as the field-journal
	// rotation above + evidence ledger #57). REPI_JOURNAL_MAX_RECORDS.
	rotateRuntimeMemoryJournalsIfNeeded();
	return anchor;
}
