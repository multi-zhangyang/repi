/**
 * Playbook maintenance + historical command candidates for REPI lanes.
 * Default product path keeps memory lean; candidates may return empty without opt-in data.
 */

export {
	memoryCommandCandidates,
	similarCaseIndexNotes,
} from "./playbooks-candidates.ts";
export type {
	MemoryCommandCandidate,
	PlaybookDeps,
	PlaybookIndexEntry,
	PlaybookMaintenanceResult,
} from "./playbooks-deps.ts";
export {
	configurePlaybooks,
	normalizeHistoricalCommand,
} from "./playbooks-deps.ts";
export {
	maintainPlaybooks,
	playbookScore,
} from "./playbooks-maintain.ts";
export {
	activePlaybookFiles,
	archivePlaybook,
	playbookAgeDays,
	playbookBashBlocks,
	playbookQualityScore,
	playbookTimestamp,
	runAutoPlaybookMetrics,
} from "./playbooks-metrics.ts";
