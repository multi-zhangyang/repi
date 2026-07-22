// ===== MEMORY SUBSYSTEM REMOVED =====
export type CompactResumeLedgerV2Report = any;
export type MemoryActiveKernelReportV14 = any;
export type MemoryDepositionReportV7 = any;
export type MemoryDepositionRuntimeEventV7 = any;
export type MemoryDistillPromotionReportV10 = any;
export type MemoryEventV1 = any;
export type MemoryExperienceReportV8 = any;
export type MemoryMaturationRuntimeReportV15 = any;
export type MemoryNoteType = any;
export type MemoryOrchestratorReportV6 = any;
export type MemoryQualityLedgerReportV11 = any;
export type MemoryReplayEvaluatorReportV12 = any;
export type MemoryScopeIsolationReportV1 = any;
export type MemoryScopeIsolationRowV1 = any;
export type MemoryScopeIsolationVerdict = any;
export type MemorySkillCapsuleReportV9 = any;
export type MemoryStrategyCapsuleReportV13 = any;
export function appendCompactResumeTransition(..._args: any[]): void {}
export function applyCaseMemoryLanePlan(..._args: any[]): any {
	return {};
}
export function buildCompactResumeLedgerV2Report(..._args: any[]): any {
	return {};
}
export function buildContextMemoryTail(..._args: any[]): any {
	return {};
}
export function buildMemoryActiveKernelReport(..._args: any[]): any {
	return {};
}
export function buildMemoryDepositionReport(..._args: any[]): any {
	return {};
}
export function buildMemoryDistillPromotionReport(..._args: any[]): any {
	return {};
}
export function buildMemoryExperienceReport(..._args: any[]): any {
	return {};
}
export function buildMemoryMaturationRuntimeReport(..._args: any[]): any {
	return {};
}
export function buildMemoryOrchestratorReport(..._args: any[]): any {
	return {};
}
export function buildMemoryQualityLedgerReport(..._args: any[]): any {
	return {};
}
export function buildMemoryReplayEvaluatorReport(..._args: any[]): any {
	return {};
}
export function buildMemoryScopeIsolationReport(..._args: any[]): any {
	return {};
}
export function buildMemorySkillCapsuleReport(..._args: any[]): any {
	return {};
}
export function buildMemoryStoreVerificationUnlocked(..._args: any[]): any {
	return {};
}
export function buildMemoryStrategyCapsuleReport(..._args: any[]): any {
	return {};
}
export function buildPerTurnMemoryRecall(..._args: any[]): any {
	// Product memory removed: never inject per-turn recall into tool results.
	return null;
}
export function buildStartupMemoryDigest(..._args: any[]): string {
	return "memory:product-removed";
}
export function caseMemoryLanePlan(..._args: any[]): any {
	return {};
}
export function caseMemoryOperatorCommands(..._args: any[]): any[] {
	return [];
}
export function compactResumeAttemptForKey(..._args: any[]): any {
	return {};
}
export function contextBranchId(..._args: any[]): any {
	return {};
}
export function contextSessionId(..._args: any[]): any {
	return {};
}
export function currentCaseMemoryLanePlan(..._args: any[]): any {
	return {};
}
export function deleteNote(..._args: any[]): void {}
export function formatCompactResumeLedgerV2(..._args: any[]): string {
	return "memory: removed";
}
export function formatPlaybookMaintenance(..._args: any[]): string {
	return "memory: removed";
}
export function invalidateDepositionChainCache(..._args: any[]): void {}
export function listNotes(..._args: any[]): any[] {
	return [];
}
export function maintainPlaybooks(..._args: any[]): any {
	return {};
}
export * from "./memory-stubs-paths.ts";
export function normalizeReconCommand(..._args: any[]): any {
	return {};
}
export function readCompactResumeTransitions(..._args: any[]): any[] {
	return [];
}
export function readMemoryDepositionEvents(..._args: any[]): any[] {
	return [];
}
export function readMemoryEvents(..._args: any[]): any[] {
	return [];
}
export function readNote(..._args: any[]): any[] {
	return [];
}
export function rebuildCaseMemoryFromEvents(..._args: any[]): any[] {
	return [];
}
export function repiMemorySettings(..._args: any[]): any {
	// Explicit off surface so hooks cannot treat empty {} as "enabled".
	return {
		mode: "removed",
		enabled: false,
		autoDepositMode: "off",
		autoRecall: false,
		autoInject: false,
		rawAutoInject: false,
		includeGlobalMemoryInContextPack: false,
		contextMemoryMode: "off",
	};
}
export function writeDispatcherPromotionPlaybook(..._args: any[]): void {}
export function writeNote(..._args: any[]): void {}
export function writeReflectionMemory(..._args: any[]): void {}

// Real ledger/atomic helpers (not full memory product surface).
export {
	contextCompactionLedger,
	rotateCompactionResumeLedgerIfNeeded,
	verifyCompactionResumeLedger,
} from "./memory-compact-resume.ts";
export {
	governanceLedgerMaxRows,
	isMemoryGovernanceLedgerRow,
	rotateGovernanceLedgerIfNeeded,
} from "./memory-search.ts";
export * from "./memory-stubs-extra.ts";
export { writeFileAtomic } from "./storage/io/atomic-write-sync.ts";
