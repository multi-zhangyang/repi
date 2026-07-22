/** REPI storage default core memory seed files (reports/indexes). */
import {
	compactResumeLedgerV2ReportPath,
	compactResumeTransitionLedgerPath,
	memoryArtifactScopeFilterReportPath,
	memoryDepositionEventBusPath,
	memoryDepositionReportPath,
	memoryFeedbackClosureReportPath,
	memoryInjectionPacketPath,
	memoryLifecycleBoardPath,
	memoryOrchestratorReportPath,
	memoryScopeIsolationReportPath,
	memorySedimentationReportPath,
	memoryStoreReportPath,
	memoryStoreSnapshotPath,
	memorySupervisorReportPath,
	memoryUsefulnessEvalReportPath,
} from "../paths.ts";

export function repiStorageMemoryCoreReportDefaultEntries(): Array<[string, string]> {
	return [
		[
			memoryInjectionPacketPath(),
			`${JSON.stringify({ kind: "repi-memory-injection-packet", schemaVersion: 1, entries: [], commands: [] }, null, 2)}\n`,
		],
		[
			memorySedimentationReportPath(),
			`${JSON.stringify({ kind: "repi-memory-sedimentation-report", schemaVersion: 1, entries: [], contradictions: [] }, null, 2)}\n`,
		],
		[
			memorySupervisorReportPath(),
			`${JSON.stringify({ kind: "repi-memory-supervisor-report", schemaVersion: 1, MemorySupervisorV1: true, decisions: [] }, null, 2)}\n`,
		],
		[memoryLifecycleBoardPath(), "# REPI Memory Lifecycle Board\n\n"],
		[
			memoryStoreReportPath(),
			`${JSON.stringify({ kind: "repi-memory-store-verification", schemaVersion: 1, MemoryStoreV5: true, eventCount: 0, caseRowCount: 0, errors: [] }, null, 2)}\n`,
		],
		[
			memoryStoreSnapshotPath(),
			`${JSON.stringify({ kind: "repi-memory-store-snapshot", schemaVersion: 1, events: [], caseMemory: [] }, null, 2)}\n`,
		],
		[
			memoryUsefulnessEvalReportPath(),
			`${JSON.stringify({ kind: "repi-memory-usefulness-eval", schemaVersion: 1, MemoryUsefulnessEvalV1: true, scenarioCount: 0, scenarios: [] }, null, 2)}\n`,
		],
		[
			memoryFeedbackClosureReportPath(),
			`${JSON.stringify({ kind: "repi-memory-feedback-closure-report", schemaVersion: 1, MemoryFeedbackClosureV1: true, rows: [] }, null, 2)}\n`,
		],
		[
			memoryScopeIsolationReportPath(),
			`${JSON.stringify({ kind: "repi-memory-scope-isolation-report", schemaVersion: 1, MemoryScopeIsolationV1: true, rows: [] }, null, 2)}\n`,
		],
		[
			memoryArtifactScopeFilterReportPath(),
			`${JSON.stringify({ kind: "repi-artifact-scope-filter-report", schemaVersion: 1, ArtifactScopeFilterV1: true, MemoryScopeIsolationV1: true, decisions: [] }, null, 2)}\n`,
		],
		[
			memoryOrchestratorReportPath(),
			`${JSON.stringify({ kind: "repi-memory-orchestrator-report", schemaVersion: 1, MemoryOrchestratorV6: true, mandatory_memory_control_loop: true, steps: [] }, null, 2)}\n`,
		],
		[memoryDepositionEventBusPath(), ""],
		[
			memoryDepositionReportPath(),
			`${JSON.stringify({ kind: "repi-memory-deposition-report", schemaVersion: 1, MemoryDepositionEngineV7: true, runtime_step_event_bus: true, post_tool_writeback_autocapture: true, runtimeEventCount: 0, memoryWritebackCount: 0, pendingWritebackCount: 0, blockedWritebackCount: 0, skippedWritebackCount: 0, autoWritebackCoverage: 0, status: "empty", recentEvents: [], pendingEventIds: [], blockedEventIds: [] }, null, 2)}\n`,
		],
		[compactResumeTransitionLedgerPath(), ""],
		[
			compactResumeLedgerV2ReportPath(),
			`${JSON.stringify({ kind: "repi-compact-resume-ledger-v2-report", schemaVersion: 1, CompactResumeLedgerV2: true, append_only_transition_ledger: true, idempotent_multi_compact_replay: true, auto_resume_budget_enforced: true, currentState: "queued", transitions: [], invalidTransitions: [] }, null, 2)}\n`,
		],
	];
}
