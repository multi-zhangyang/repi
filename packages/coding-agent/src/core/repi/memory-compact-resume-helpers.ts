import { memoryPath } from "./storage.ts";

export const COMPACTION_LEDGER_GENESIS = "0".repeat(64);

export function compactionLedgerPath(): string {
	return memoryPath("compaction-resume-ledger.jsonl");
}

/** Non-empty lines only — matches verifier empty-line-skipping scheme. */
export function compactionNonEmptyLines(text: string): string[] {
	return text.split(/\r?\n/).filter((line) => line.trim());
}

export function compactionLedgerMaxRows(env: NodeJS.ProcessEnv = process.env): number {
	const raw = env.REPI_COMPACTION_LEDGER_MAX_ROWS;
	if (raw === undefined || raw === "") return 500;
	const n = Number(raw);
	if (!Number.isFinite(n) || n < 0) return 500;
	return Math.floor(n);
}
