/** Evidence ledger rotation + append helpers. */
import process from "node:process";
import { tailCapMarkdownBlockLedger } from "../journal.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { evidenceLedgerPath, writePrivateTextFile } from "../storage.ts";
import { readTextFile } from "./io-read.ts";

export function runtimeEvidenceLedgerMaxRecords(): number {
	const raw = process.env.REPI_EVIDENCE_LEDGER_MAX_RECORDS;
	if (raw === undefined) return 200;
	const n = Math.floor(Number(raw));
	return Number.isFinite(n) && n >= 0 ? n : 200; // 0 = disable record rotation
}

export function runtimeEvidenceLedgerMaxBytes(): number {
	const raw = process.env.REPI_EVIDENCE_LEDGER_MAX_BYTES;
	if (raw === undefined) return 256 * 1024;
	const n = Math.floor(Number(raw));
	return Number.isFinite(n) && n >= 0 ? n : 256 * 1024; // 0 = disable byte rotation
}

export function rotateRuntimeEvidenceLedgerIfNeeded(): void {
	tailCapMarkdownBlockLedger(evidenceLedgerPath(), runtimeEvidenceLedgerMaxRecords(), runtimeEvidenceLedgerMaxBytes());
}

export function appendText(path: string, text: string): void {
	const prev = readTextFile(path);
	const sep = prev && !prev.endsWith("\n") ? "\n" : "";
	// reverse-heavy evidence appends may seed reverse_next footer when path is ledger-like
	let payload = text;
	if (/evidence|native|pwn|malware|firmware|browser|authz|js-signing|proof/i.test(`${path}\n${text}`)) {
		const reverseNext = reverseDomainCaptureNextCommands({
			routeOrBlob: `${path}\n${text}`,
			includeGates: true,
		}).slice(0, 1);
		if (reverseNext.length && !/reverse_next:/i.test(text)) {
			payload = `${text}${text.endsWith("\n") ? "" : "\n"}reverse_next: ${reverseNext[0]}\n`;
		}
	}
	writePrivateTextFile(path, prev ? `${prev}${sep}${payload}` : payload);
}
