/** Memory path helpers. */
import { memoryPath } from "./memory-core.ts";

export function memoryExperienceEpisodesPath(): string {
	return memoryPath("experience-episodes.jsonl");
}

export function memoryExperienceClaimsPath(): string {
	return memoryPath("experience-claims.jsonl");
}

export function memoryExperienceLessonBookPath(): string {
	return memoryPath("experience-lesson-book.md");
}

export function memoryExperiencePromotionLedgerPath(): string {
	return memoryPath("experience-promotions.jsonl");
}

export function memoryExperienceReportPath(): string {
	return memoryPath("experience-report.json");
}

export function memorySkillCapsuleLedgerPath(): string {
	return memoryPath("skill-capsules.jsonl");
}

export function memorySkillCapsuleReportPath(): string {
	return memoryPath("skill-capsule-report.json");
}

export function memorySkillCapsuleBookPath(): string {
	return memoryPath("skill-capsule-book.md");
}

export function memoryDistillPromotionCandidateLedgerPath(): string {
	return memoryPath("distill-promotion-candidates.jsonl");
}

export function memoryDistillPromotionReportPath(): string {
	return memoryPath("distill-promotion-report.json");
}

export function memoryDistillPromotionBookPath(): string {
	return memoryPath("distill-promotion-book.md");
}

export function memoryQualityLedgerPath(): string {
	return memoryPath("quality-ledger.jsonl");
}

export function memoryQualityReportPath(): string {
	return memoryPath("quality-report.json");
}

export function memoryQualityBoardPath(): string {
	return memoryPath("quality-board.md");
}

export function memoryReplayEvaluatorLedgerPath(): string {
	return memoryPath("replay-evaluator-ledger.jsonl");
}

export function memoryReplayEvaluatorReportPath(): string {
	return memoryPath("replay-evaluator-report.json");
}

export function memoryReplayEvaluatorBoardPath(): string {
	return memoryPath("replay-evaluator-board.md");
}

export function memoryStrategyCapsuleLedgerPath(): string {
	return memoryPath("strategy-capsules.jsonl");
}

export function memoryStrategyCapsuleReportPath(): string {
	return memoryPath("strategy-capsule-report.json");
}

export function memoryStrategyCapsuleBookPath(): string {
	return memoryPath("strategy-capsule-book.md");
}
