/**
 * Compaction-resume ledger (hash chain + rotation).
 * Used by context-pack / completion-audit; not a full memory product surface.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import {
	COMPACTION_LEDGER_GENESIS,
	compactionLedgerMaxRows,
	compactionLedgerPath,
	compactionNonEmptyLines,
} from "./memory-compact-resume-helpers.ts";
import { writeFileAtomic } from "./storage/io/atomic-write-sync.ts";
import { sha256Text } from "./text.ts";

export { compactionLedgerMaxRows } from "./memory-compact-resume-helpers.ts";
/**
 * Next chain hashes for a context-pack append.
 * prevHash = sha256 of prior non-empty lines each + "\n" (or genesis when empty).
 */
export function contextCompactionLedger(timestamp: string): { prevHash: string; entryHash: string } {
	const path = compactionLedgerPath();
	let previousText = "";
	if (existsSync(path)) {
		try {
			const raw = readFileSync(path, "utf8");
			// Reconstruct accumulation from non-empty lines only.
			const lines = compactionNonEmptyLines(raw);
			previousText = lines.length ? `${lines.join("\n")}\n` : "";
		} catch {
			previousText = "";
		}
	}
	const prevHash = previousText.trim() ? sha256Text(previousText) : COMPACTION_LEDGER_GENESIS;
	const entryHash = sha256Text(`${prevHash}\n${timestamp}\ncontext-pack`);
	return { prevHash, entryHash };
}
export function verifyCompactionResumeLedger(path = compactionLedgerPath()): {
	status: "pass" | "fail";
	blocked: string[];
	rows: number;
} {
	if (!existsSync(path)) {
		return { status: "pass", blocked: [], rows: 0 };
	}
	let text = "";
	try {
		text = readFileSync(path, "utf8");
	} catch {
		return { status: "fail", blocked: ["unreadable"], rows: 0 };
	}
	const lines = compactionNonEmptyLines(text);
	let previousText = "";
	const blocked: string[] = [];
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]!;
		let row: { ts?: string; prevHash?: string; entryHash?: string };
		try {
			row = JSON.parse(line) as { ts?: string; prevHash?: string; entryHash?: string };
		} catch {
			blocked.push(`row_${i}_json`);
			continue;
		}
		const expectedPrev = previousText.trim() ? sha256Text(previousText) : COMPACTION_LEDGER_GENESIS;
		if (row.prevHash !== expectedPrev) blocked.push(`row_${i}_prevHash`);
		const expectedEntry = sha256Text(`${expectedPrev}\n${row.ts ?? ""}\ncontext-pack`);
		if (row.entryHash !== expectedEntry) blocked.push(`row_${i}_entryHash`);
		previousText += `${line}\n`;
	}
	return {
		status: blocked.length === 0 ? "pass" : "fail",
		blocked,
		rows: lines.length,
	};
}
/** Cap ledger to last N rows and re-hash forward from genesis so verify still passes. */
export function rotateCompactionResumeLedgerIfNeeded(env: NodeJS.ProcessEnv = process.env): void {
	const cap = compactionLedgerMaxRows(env);
	if (cap <= 0) return;
	const path = compactionLedgerPath();
	if (!existsSync(path)) return;
	let text = "";
	try {
		text = readFileSync(path, "utf8");
	} catch {
		return;
	}
	const lines = compactionNonEmptyLines(text);
	if (lines.length <= cap) return;
	const tail = lines.slice(-cap);
	const rebuilt: string[] = [];
	let previousText = "";
	for (let i = 0; i < tail.length; i++) {
		let row: { ts?: string };
		try {
			row = JSON.parse(tail[i]!) as { ts?: string };
		} catch {
			continue;
		}
		const ts = row.ts ?? `rotated-${i}`;
		const prevHash = previousText.trim() ? sha256Text(previousText) : COMPACTION_LEDGER_GENESIS;
		const entryHash = sha256Text(`${prevHash}\n${ts}\ncontext-pack`);
		const line = JSON.stringify({ ts, prevHash, entryHash });
		rebuilt.push(line);
		previousText += `${line}\n`;
	}
	try {
		mkdirSync(dirname(path), { recursive: true });
	} catch {
		/* parent may exist */
	}
	writeFileAtomic(path, rebuilt.length ? `${rebuilt.join("\n")}\n` : "");
}
