/**
 * Attack graph build/write/show runtime.
 * Implementation under ./attack-graph/*.
 */

export { buildAttackGraph } from "./attack-graph/build.ts";
export type { AttackGraphDeps } from "./attack-graph/deps.ts";
export { configureAttackGraph, deps } from "./attack-graph/deps.ts";
export {
	evidenceLedgerBullet,
	evidenceLedgerCommand,
	evidenceLedgerMetaFields,
	evidenceLedgerQueryFields,
	evidenceRecordHasCounterSignal,
	evidenceRecordHasHypothesisSignal,
	parseEvidenceLedgerTaskRecords,
} from "./attack-graph/evidence.ts";
export {
	buildAttackGraphOutput,
	parseAttackGraphArtifact,
	writeAttackGraphArtifact,
} from "./attack-graph/io.ts";
export {
	attackGraphNextActions,
	latestAttackGraphArtifactPath,
} from "./attack-graph/next-actions.ts";
