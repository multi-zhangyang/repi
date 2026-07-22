/** Evidence runtime configure + append. */

/** Evidence ledger format, digests, and append. */
import { ensureReconStorage } from "../resources.ts";
import { appendText, rotateRuntimeEvidenceLedgerIfNeeded } from "./io.ts";
import { appendEvidenceRecord } from "./ledger-format.ts";
import type { EvidenceRecord, EvidenceRuntimeDeps } from "./types.ts";

let evidenceRuntimeDeps: EvidenceRuntimeDeps | null = null;

export function configureEvidenceRuntime(deps: EvidenceRuntimeDeps): void {
	evidenceRuntimeDeps = deps;
}
function updateMissionCheckpoint(...args: any[]): any {
	if (!evidenceRuntimeDeps) return undefined;
	return evidenceRuntimeDeps.updateMissionCheckpoint(...args);
}
export function appendEvidence(
	record: Omit<EvidenceRecord, "timestamp" | "priority"> & { priority?: number },
): EvidenceRecord {
	const full = appendEvidenceRecord(record, {
		ensureStorage: ensureReconStorage,
		appendText,
		onLedgerUpdated: (updated) => updateMissionCheckpoint("evidence_ledger_updated", "done", updated.title),
	});
	// Tail-rotate the evidence ledger after append. The ledger is an append-only
	// markdown audit log (no hash chain, no per-record counts) appended via the
	// shared read-modify-write appendText; without rotation it grows unbounded
	// across sessions and every append's read-modify-write gets O(n) larger.
	// Readers already truncate to a tail window, so capping is behavior-preserving.
	rotateRuntimeEvidenceLedgerIfNeeded();
	return full;
}
