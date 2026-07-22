/**
 * REPI kernel assembly entry.
 *
 * The product runtime lives in `./repi/kernel/profile-runtime.ts`.
 * This shim keeps historical import paths (`../core/recon-profile.ts`) stable
 * while the monolith is modularized under `core/repi/*`.
 *
 * New reverse/pentest capabilities belong in `core/repi/*` first; this file
 * only re-exports the kernel and thin resource contracts.
 */

export { parsePlannerDecision } from "./repi/auto-lane/decision-parse.ts";
// Historical test/product imports that still target recon-profile.ts.
// Implementations live under core/repi/*; keep the monofile path stable.
export { writeLocalClaimReleaseMarker } from "./repi/claim-release.ts";
export { appendEvidence } from "./repi/evidence.ts";
export type {
	FailureLedgerEventV1,
	RepairQueueItemV1,
} from "./repi/failure-repair.ts";
export {
	appendFailureRepairLedger,
	failureSignaturePriorityReport,
	readRuntimeFailureLedgerRows,
	readRuntimeRepairQueueRows,
	runtimeFailureAttempt,
} from "./repi/failure-repair.ts";
// Built-in goal mode is installed by the kernel runtime via installRepiGoalMode(pi)
// (see core/repi/kernel/profile-runtime-install.ts). Doctor scans this historical entry.
export { installRepiGoalMode } from "./repi/goal.ts";
export * from "./repi/kernel/profile-runtime.ts";
// Named so product-contract / docs can assert the assembly entry still owns the
// factory surface without loading the full runtime module graph.
export { createReconExtensionFactory } from "./repi/kernel/profile-runtime.ts";
export { buildMemoryDepositionReport, buildPerTurnMemoryRecall, readMemoryEvents } from "./repi/memory-stubs.ts";
export { appendMemoryEventTransaction } from "./repi/memory-transaction.ts";
export {
	routeReconTask,
	writeCurrentMission,
} from "./repi/mission.ts";
export {
	createReconResourceLoaderOptions,
	RECON_APPEND_SYSTEM_PROMPT,
	RECON_SYSTEM_PROMPT,
	REPI_REASONING_DOCTRINE,
} from "./repi/resources.ts";
export { type RoutePlan, routeRepiTask } from "./repi/routes.ts";
export { parseSupervisorCritique } from "./repi/supervisor/review-budget.ts";
export { swarmWorkerSpec } from "./repi/swarm-exec/pure-basics.ts";
export {
	appendToolCallTraceFromCall,
	appendToolCallTraceFromResult,
	invalidateToolTraceReportCache,
	readToolTraceEvents,
	verifyToolCallTraceLedgerV1,
} from "./repi/tool-trace.ts";
