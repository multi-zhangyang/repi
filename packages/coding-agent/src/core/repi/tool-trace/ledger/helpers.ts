/** Tool-trace ledger path stats and rotation caps. */
import { statSync } from "node:fs";
import { toolCallTraceLedgerPath } from "../../storage.ts";

export function statToolTraceLedger(): { mtimeMs: number; size: number } | null {
	try {
		const s = statSync(toolCallTraceLedgerPath());
		return { mtimeMs: s.mtimeMs, size: s.size };
	} catch {
		return null;
	}
}

export function toolCallTraceLedgerMaxRows(): number {
	const raw = Number(process.env.REPI_TOOL_TRACE_LEDGER_MAX_ROWS);
	if (Number.isFinite(raw) && raw >= 0) return Math.floor(raw);
	return 500;
}
