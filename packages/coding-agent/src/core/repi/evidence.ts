/**
 * Evidence ledger and digest helpers.
 * Implementation under ./evidence/*.
 */

export {
	lineCount,
	readTextFile,
} from "./evidence/io.ts";
export {
	appendEvidence,
	appendEvidenceRecord,
	buildContextEvidenceTail,
	buildEvidenceDigest,
	buildStartupContextDigest,
	buildStartupEvidenceDigest,
	configureEvidenceRuntime,
	evidenceLedgerGraphNodes,
	evidencePriority,
	formatEvidenceRecord,
} from "./evidence/ledger.ts";
export type {
	AppendEvidenceOptions,
	EvidenceGraphNode,
	EvidenceIoOptions,
	EvidenceKind,
	EvidenceRecord,
	EvidenceRuntimeDeps,
} from "./evidence/types.ts";
