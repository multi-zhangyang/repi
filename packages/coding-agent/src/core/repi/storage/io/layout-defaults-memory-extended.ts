/** REPI storage default extended memory seed files. */
import {
	memoryActiveInjectionPackPath,
	memoryActiveKernelReportPath,
	memoryActiveStrategyBoardPath,
	memoryDistillPromotionBookPath,
	memoryDistillPromotionCandidateLedgerPath,
	memoryDistillPromotionReportPath,
	memoryExperienceClaimsPath,
	memoryExperienceEpisodesPath,
	memoryExperienceLessonBookPath,
	memoryExperiencePromotionLedgerPath,
	memoryExperienceReportPath,
	memoryMaturationActionBoardPath,
	memoryMaturationRuntimeLedgerPath,
	memoryMaturationRuntimeReportPath,
	memoryQualityBoardPath,
	memoryQualityLedgerPath,
	memoryQualityReportPath,
	memoryReplayEvaluatorBoardPath,
	memoryReplayEvaluatorLedgerPath,
	memoryReplayEvaluatorReportPath,
	memorySkillCapsuleBookPath,
	memorySkillCapsuleLedgerPath,
	memorySkillCapsuleReportPath,
	memoryStrategyCapsuleBookPath,
	memoryStrategyCapsuleLedgerPath,
	memoryStrategyCapsuleReportPath,
	memoryVectorIndexPath,
	memoryVectorSearchReportPath,
} from "../paths.ts";

export function repiStorageMemoryExtendedDefaultEntries(
	memoryEmbeddingProvider: Record<string, unknown>,
): Array<[string, string]> {
	return [
		[memoryExperienceEpisodesPath(), ""],
		[memoryExperienceClaimsPath(), ""],
		[memoryExperienceLessonBookPath(), "# REPI Memory Experience Lesson Book\n\n"],
		[memoryExperiencePromotionLedgerPath(), ""],
		[
			memoryExperienceReportPath(),
			`${JSON.stringify({ kind: "repi-memory-experience-report", schemaVersion: 1, MemoryExperienceEngineV8: true, episode_model_v8: true, structured_claim_extraction: true, lesson_promotion_check: true, contradiction_resolution: true, usefulness_backprop: true, episodeCount: 0, claimCount: 0, lessonCount: 0, promotionDecisionCount: 0, promotedClaimIds: [], retainedClaimIds: [], demotedClaimIds: [], quarantinedClaimIds: [], conflictedClaimIds: [], operatorInjectionCommands: [], avoidCommands: [], verifyCommands: [], promotionCoverage: 0, status: "empty", recentEpisodes: [], recentClaims: [], recentLessons: [] }, null, 2)}\n`,
		],
		[memorySkillCapsuleLedgerPath(), ""],
		[memorySkillCapsuleBookPath(), "# REPI Memory Skill Capsule Book\n\n"],
		[
			memorySkillCapsuleReportPath(),
			`${JSON.stringify({ kind: "repi-memory-skill-capsule-report", schemaVersion: 1, MemorySkillCapsuleV9: true, skill_capsule_assetization: true, verified_skill_promotion_check: true, operator_skill_injection: true, capsuleCount: 0, promotedCapsuleIds: [], candidateCapsuleIds: [], quarantinedCapsuleIds: [], demotedCapsuleIds: [], operatorInjectionCommands: [], verifierCommands: [], avoidCommands: [], workerRoutingHints: [], status: "empty", recentCapsules: [] }, null, 2)}\n`,
		],
		[memoryDistillPromotionCandidateLedgerPath(), ""],
		[memoryDistillPromotionBookPath(), "# REPI Memory Distill Promotion Book\n\n"],
		[
			memoryDistillPromotionReportPath(),
			`${JSON.stringify({ kind: "repi-memory-distill-promotion-report", schemaVersion: 1, MemoryDistillPromotionV10: true, provider_distill_contract: true, artifact_to_claim_distillation: true, verifier_backed_promotion_check: true, skill_capsule_promotion_writeback: true, candidateCount: 0, promotedCandidateIds: [], retainedCandidateIds: [], quarantinedCandidateIds: [], demotedCandidateIds: [], operatorInjectionCommands: [], verifierCommands: [], avoidCommands: [], status: "empty", recentCandidates: [] }, null, 2)}\n`,
		],
		[memoryQualityLedgerPath(), ""],
		[memoryQualityBoardPath(), "# REPI Memory Quality Board\n\n"],
		[
			memoryQualityReportPath(),
			`${JSON.stringify({ kind: "repi-memory-quality-ledger-report", schemaVersion: 1, MemoryQualityLedgerV11: true, active_memory_policy: true, quality_score_feedback_loop: true, usefulness_feedback_writeback: true, eventCount: 0, rowCount: 0, averageQualityScore: 0, promotedEventIds: [], retainedEventIds: [], demotedEventIds: [], quarantinedEventIds: [], expiredEventIds: [], requiredFeedbackEventIds: [], operatorInjectionCommands: [], avoidCommands: [], status: "empty", rows: [] }, null, 2)}\n`,
		],
		[memoryReplayEvaluatorLedgerPath(), ""],
		[memoryReplayEvaluatorBoardPath(), "# REPI Memory Replay Evaluator Board\n\n"],
		[
			memoryReplayEvaluatorReportPath(),
			`${JSON.stringify({ kind: "repi-memory-replay-evaluator-report", schemaVersion: 1, MemoryReplayEvaluatorV12: true, memory_ab_replay: true, causal_attribution_signal: true, replay_delta_feedback_writeback: true, scenarioCount: 0, rowCount: 0, improvedScenarioIds: [], neutralScenarioIds: [], regressedScenarioIds: [], blockedScenarioIds: [], attributionEventIds: [], regressionEventIds: [], averageCausalScore: 0, totalSavedStepEstimate: 0, operatorInjectionCommands: [], avoidCommands: [], status: "empty", rows: [] }, null, 2)}\n`,
		],
		[memoryStrategyCapsuleLedgerPath(), ""],
		[memoryStrategyCapsuleBookPath(), "# REPI Memory Strategy Capsule Book\n\n"],
		[
			memoryStrategyCapsuleReportPath(),
			`${JSON.stringify({ kind: "repi-memory-strategy-capsule-report", schemaVersion: 1, MemoryStrategyCapsuleV13: true, executable_strategy_capsule: true, replay_backed_strategy_promotion: true, strategy_quality_check: true, capsuleCount: 0, promotedCapsuleIds: [], candidateCapsuleIds: [], demotedCapsuleIds: [], quarantinedCapsuleIds: [], operatorInjectionCommands: [], verifierCommands: [], avoidCommands: [], fallbackCommands: [], workerRoutingHints: [], status: "empty", recentCapsules: [] }, null, 2)}\n`,
		],
		[
			memoryActiveKernelReportPath(),
			`${JSON.stringify({ kind: "repi-memory-active-kernel-report", schemaVersion: 1, MemoryActiveKernelV14: true, unified_memory_decision_engine: true, active_recall_scheduler: true, scope_safe_strategy_injection: true, decisionCount: 0, injectDecisionIds: [], reuseDecisionIds: [], verifyDecisionIds: [], avoidDecisionIds: [], quarantineDecisionIds: [], pendingFeedbackDecisionIds: [], operatorInjectionCommands: [], verifierCommands: [], fallbackCommands: [], avoidCommands: [], status: "empty", decisions: [] }, null, 2)}\n`,
		],
		[
			memoryActiveInjectionPackPath(),
			`${JSON.stringify({ kind: "repi-memory-active-injection-pack", schemaVersion: 1, MemoryActiveKernelV14: true, active_recall_scheduler: true, decisions: [], commands: [], verifierRules: [], fallbackCommands: [], avoidCommands: [] }, null, 2)}\n`,
		],
		[memoryActiveStrategyBoardPath(), "# REPI Memory Active Strategy Board\n\n"],
		[
			memoryMaturationRuntimeReportPath(),
			`${JSON.stringify({ kind: "repi-memory-maturation-runtime-report", schemaVersion: 1, MemoryMaturationRuntimeV15: true, automatic_memory_maturation_pipeline: true, tool_result_to_strategy_loop: true, closed_loop_writeback: true, retention_decay_scheduler: true, stale_memory_rehearsal_queue: true, usefulness_backprop_to_maturation: true, rowCount: 0, promotedEventIds: [], retainedEventIds: [], demotedEventIds: [], quarantinedEventIds: [], pendingFeedbackEventIds: [], replayRequiredEventIds: [], retentionQueueEventIds: [], expiredEventIds: [], operatorCommands: [], feedbackCommands: [], retentionCommands: [], status: "empty", rows: [] }, null, 2)}\n`,
		],
		[memoryMaturationRuntimeLedgerPath(), ""],
		[memoryMaturationActionBoardPath(), "# REPI Memory Maturation Action Board\n\n"],
		[
			memoryVectorIndexPath(),
			`${JSON.stringify({ kind: "repi-memory-vector-index", schemaVersion: 1, MemoryVectorIndexV1: true, embeddingProvider: memoryEmbeddingProvider, entries: [] }, null, 2)}\n`,
		],
		[
			memoryVectorSearchReportPath(),
			`${JSON.stringify({ kind: "repi-memory-vector-search-report", schemaVersion: 1, MemoryVectorSearchV1: true, embeddingProvider: memoryEmbeddingProvider, hits: [] }, null, 2)}\n`,
		],
	];
}
