/**
 * Memory governance ledger helpers (rotation + row guard).
 * Product memory surface remains opt-in / removed; ledger IO still used by runtime hygiene.
 */
import { existsSync, readFileSync } from "node:fs";
import { writeFileAtomic } from "./storage/io/atomic-write-sync.ts";
import { memoryGovernanceLedgerPath } from "./storage.ts";

export function governanceLedgerMaxRows(env: NodeJS.ProcessEnv = process.env): number {
	const raw = env.REPI_GOVERNANCE_LEDGER_MAX_ROWS;
	if (raw === undefined || raw === "") return 500;
	const n = Number(raw);
	if (!Number.isFinite(n) || n < 0) return 500;
	return Math.floor(n);
}

export function isMemoryGovernanceLedgerRow(value: unknown): value is {
	kind: string;
	id?: string;
	action?: string;
	applied?: boolean;
	sourceEventId?: string;
	eventId?: string;
	reason?: string;
	[key: string]: unknown;
} {
	if (!value || typeof value !== "object") return false;
	const row = value as Record<string, unknown>;
	return typeof row.kind === "string" && row.kind.includes("governance");
}

/** Keep last N governance rows; no-op when cap is 0 or under limit. */
export function rotateGovernanceLedgerIfNeeded(env: NodeJS.ProcessEnv = process.env): void {
	const cap = governanceLedgerMaxRows(env);
	if (cap <= 0) return;
	const path = memoryGovernanceLedgerPath();
	if (!existsSync(path)) return;
	let text = "";
	try {
		text = readFileSync(path, "utf8");
	} catch {
		return;
	}
	const lines = text.split(/\r?\n/).filter((line) => line.trim());
	if (lines.length <= cap) return;
	const kept = lines.slice(-cap);
	writeFileAtomic(path, kept.length ? `${kept.join("\n")}\n` : "");
}

// Residual search/cache surface (memory product removed).
export function readMemoryEvents(..._args: any[]): any[] {
	return [];
}
export function memoryBlockingGovernanceBySource(..._args: any[]): any {
	return {};
}
export function cachedArtifactSearchTokens(..._args: any[]): string[] {
	return [];
}
export function cachedCaseSearchTokens(..._args: any[]): string[] {
	return [];
}
export function cachedEventSearchTokens(..._args: any[]): string[] {
	return [];
}
export function lexicalTokenGeneration(..._args: any[]): number {
	return 0;
}
