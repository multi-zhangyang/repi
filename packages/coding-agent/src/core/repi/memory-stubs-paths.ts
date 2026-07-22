/** Memory path helpers for residual call sites (real recon/memory paths). */
import { join } from "node:path";
import { getAgentDir } from "../../config.ts";

function reconDir(): string {
	return join(getAgentDir(), "recon");
}

// Minimal scope mirror of storage/paths/memory-core.ts (avoid circular re-export).
let memoryScopeCwd: string | null = null;

export function setMemoryScopeCwd(cwd: string | null): void {
	memoryScopeCwd = cwd ? cwd : null;
}

export function getMemoryScopeCwd(): string | null {
	return memoryScopeCwd;
}

export function encodeCwdForScope(cwd: string): string {
	return `--${String(cwd)
		.replace(/^[/\\]/, "")
		.replace(/[/\\:]/g, "-")}--`;
}

export function scopedMemoryRoot(): string {
	if (memoryScopeCwd) {
		return join(reconDir(), "memory", "projects", encodeCwdForScope(memoryScopeCwd));
	}
	return join(reconDir(), "memory");
}

export function memoryPath(name: string = "", ..._args: any[]): string {
	return join(scopedMemoryRoot(), name);
}

function mp(name: string): string {
	return memoryPath(name);
}

export function memoryPlaybooksDir(): string {
	return join(scopedMemoryRoot(), "playbooks");
}
export function memoryPlaybooksArchiveDir(): string {
	return join(memoryPlaybooksDir(), "archive");
}
export function memoryNotesDir(): string {
	return join(scopedMemoryRoot(), "notes");
}
export function memoryNotesIndexPath(): string {
	return mp("notes-index.md");
}
export function memoryNotePath(name: string): string {
	return join(memoryNotesDir(), `${name}.md`);
}
export function memoryEventsPath(): string {
	return mp("events.jsonl");
}
export function caseMemoryPath(): string {
	return mp("case-memory.jsonl");
}
export function memoryCorePath(): string {
	return mp("core-memory.md");
}
export function memoryProjectPath(): string {
	return mp("project-memory.md");
}
export function memoryProceduralPath(): string {
	return mp("procedural-memory.md");
}
export function memoryTransactionsDir(): string {
	return mp("transactions");
}
export function memoryTransactionPath(id: string): string {
	return join(memoryTransactionsDir(), `${id}.json`);
}
export function memoryRetrievalReportPath(): string {
	return mp("retrieval-report.json");
}
export function memoryDistillationReportPath(): string {
	return mp("distillation-report.json");
}
export function memoryPatternBookPath(): string {
	return mp("pattern-book.md");
}
export function memoryQuarantinePath(): string {
	return mp("quarantine.json");
}
export function memorySemanticIndexPath(): string {
	return mp("semantic-index.json");
}
export function memoryContradictionLedgerPath(): string {
	return mp("contradiction-ledger.jsonl");
}
export function memoryInjectionPacketPath(): string {
	return mp("injection-packet.json");
}
export function memorySedimentationReportPath(): string {
	return mp("sedimentation-report.json");
}
export function memorySupervisorReportPath(): string {
	return mp("supervisor-report.json");
}
export function memoryLifecycleBoardPath(): string {
	return mp("lifecycle-board.md");
}
export function memoryStoreLockPath(): string {
	return mp("store.lock");
}
export function memoryStoreReportPath(): string {
	return mp("store-report.json");
}
export function memoryStoreSnapshotPath(): string {
	return mp("store-snapshot.json");
}
export function memoryUsefulnessEvalReportPath(): string {
	return mp("usefulness-eval.json");
}
export function memoryFeedbackClosureReportPath(): string {
	return mp("feedback-closure-report.json");
}
export function memoryScopeIsolationReportPath(): string {
	return mp("scope-isolation-report.json");
}
export function memoryArtifactScopeFilterReportPath(): string {
	return mp("artifact-scope-filter-report.json");
}
export function memoryOrchestratorReportPath(): string {
	return mp("orchestrator-report.json");
}
export function memoryDepositionEventBusPath(): string {
	return mp("deposition-events.jsonl");
}
export function memoryDepositionReportPath(): string {
	return mp("deposition-report.json");
}
export function memoryExperienceEpisodesPath(): string {
	return mp("experience-episodes.jsonl");
}
export function memoryExperienceClaimsPath(): string {
	return mp("experience-claims.jsonl");
}
export function memoryExperienceLessonBookPath(): string {
	return mp("experience-lesson-book.md");
}
export function memoryExperiencePromotionLedgerPath(): string {
	return mp("experience-promotions.jsonl");
}
export function memoryExperienceReportPath(): string {
	return mp("experience-report.json");
}
export function memorySkillCapsuleLedgerPath(): string {
	return mp("skill-capsules.jsonl");
}
export function memorySkillCapsuleReportPath(): string {
	return mp("skill-capsule-report.json");
}
export function memorySkillCapsuleBookPath(): string {
	return mp("skill-capsule-book.md");
}
export function memoryDistillPromotionCandidateLedgerPath(): string {
	return mp("distill-promotion-candidates.jsonl");
}
export function memoryDistillPromotionReportPath(): string {
	return mp("distill-promotion-report.json");
}
export function memoryDistillPromotionBookPath(): string {
	return mp("distill-promotion-book.md");
}
export function memoryQualityLedgerPath(): string {
	return mp("quality-ledger.jsonl");
}
export function memoryQualityReportPath(): string {
	return mp("quality-report.json");
}
export function memoryQualityBoardPath(): string {
	return mp("quality-board.md");
}
export function memoryReplayEvaluatorLedgerPath(): string {
	return mp("replay-evaluator-ledger.jsonl");
}
export function memoryReplayEvaluatorReportPath(): string {
	return mp("replay-evaluator-report.json");
}
export function memoryReplayEvaluatorBoardPath(): string {
	return mp("replay-evaluator-board.md");
}
export function memoryStrategyCapsuleLedgerPath(): string {
	return mp("strategy-capsules.jsonl");
}
export function memoryStrategyCapsuleReportPath(): string {
	return mp("strategy-capsule-report.json");
}
export function memoryStrategyCapsuleBookPath(): string {
	return mp("strategy-capsule-book.md");
}
export function memoryActiveKernelReportPath(): string {
	return mp("active-kernel-report.json");
}
export function memoryActiveInjectionPackPath(): string {
	return mp("active-injection-pack.json");
}
export function memoryActiveStrategyBoardPath(): string {
	return mp("active-strategy-board.md");
}
export function memoryMaturationRuntimeReportPath(): string {
	return mp("maturation-runtime-report.json");
}
export function memoryMaturationRuntimeLedgerPath(): string {
	return mp("maturation-runtime-ledger.jsonl");
}
export function memoryMaturationActionBoardPath(): string {
	return mp("maturation-action-board.md");
}
export function memoryStatusReportPath(): string {
	return mp("status-report.json");
}
export function memoryStatusBoardPath(): string {
	return mp("status-board.md");
}
export function memoryGovernanceLedgerPath(): string {
	return mp("governance-ledger.jsonl");
}
export function memoryVectorIndexPath(): string {
	return mp("vector-index.json");
}
export function memoryVectorSearchReportPath(): string {
	return mp("vector-search-report.json");
}

export function memoryDepositionEventHash(..._args: any[]): any {
	return {};
}
export function memoryEventHash(..._args: any[]): any {
	return {};
}
export function memoryOrchestratorPhaseCommand(..._args: any[]): any {
	return {};
}
export function memoryTargetScope(..._args: any[]): any {
	return {};
}
