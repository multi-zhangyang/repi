/** Memory path helpers: core reports/ledgers. */
import { join } from "node:path";
import { encodeCwdForScope, memoryPath, scopedMemoryRoot } from "./memory-core.ts";
export { encodeCwdForScope };

export function memoryNotesIndexPath(): string {
	return join(scopedMemoryRoot(), "MEMORY.md");
}

export function memoryRetrievalReportPath(): string {
	return memoryPath("retrieval-report.json");
}

export function memoryDistillationReportPath(): string {
	return memoryPath("distillation-report.json");
}

export function memoryPatternBookPath(): string {
	return memoryPath("pattern-book.md");
}

export function memoryQuarantinePath(): string {
	return memoryPath("quarantine.json");
}

export function memorySemanticIndexPath(): string {
	return memoryPath("semantic-index.json");
}

export function memoryContradictionLedgerPath(): string {
	return memoryPath("contradiction-ledger.jsonl");
}

export function memoryInjectionPacketPath(): string {
	return memoryPath("injection-packet.json");
}

export function memorySedimentationReportPath(): string {
	return memoryPath("sedimentation-report.json");
}

export function memorySupervisorReportPath(): string {
	return memoryPath("supervisor-report.json");
}

export function memoryLifecycleBoardPath(): string {
	return memoryPath("lifecycle-board.md");
}

export function memoryStoreLockPath(): string {
	return memoryPath(".store.lock");
}

export function memoryStoreReportPath(): string {
	return memoryPath("store-report.json");
}

export function memoryStoreSnapshotPath(): string {
	return memoryPath("store-snapshot.json");
}
