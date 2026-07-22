/** Memory path helpers. */
import { memoryPath } from "./memory-core.ts";

export function memoryActiveKernelReportPath(): string {
	return memoryPath("active-kernel-report.json");
}

export function memoryActiveInjectionPackPath(): string {
	return memoryPath("active-injection-pack.json");
}

export function memoryActiveStrategyBoardPath(): string {
	return memoryPath("active-strategy-board.md");
}

export function memoryMaturationRuntimeReportPath(): string {
	return memoryPath("maturation-runtime-report.json");
}

export function memoryMaturationRuntimeLedgerPath(): string {
	return memoryPath("maturation-runtime-ledger.jsonl");
}

export function memoryMaturationActionBoardPath(): string {
	return memoryPath("maturation-action-board.md");
}

export function memoryStatusReportPath(): string {
	return memoryPath("status-report.json");
}

export function memoryStatusBoardPath(): string {
	return memoryPath("status-board.md");
}

export function memoryGovernanceLedgerPath(): string {
	return memoryPath("governance-ledger.jsonl");
}

export function memoryVectorIndexPath(): string {
	return memoryPath("vector-index.json");
}

export function memoryVectorSearchReportPath(): string {
	return memoryPath("vector-search-report.json");
}
