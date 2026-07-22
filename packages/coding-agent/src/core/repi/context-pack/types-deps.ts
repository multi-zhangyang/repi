/** Context-pack dependency bag type. */
export type ContextPackDeps = {
	[key: string]: any;
	activeLane: (...args: any[]) => any;
	appendCompactResumeTransition: (...args: any[]) => any;
	appendEvidence: (...args: any[]) => any;
	artifactScopeInferTarget: (...args: any[]) => any;
	autonomousExecutionBudget: (...args: any[]) => any;
	buildCompactResumeLedgerV2Report: (...args: any[]) => any;
	buildContextEvidenceTail: (...args: any[]) => any;
	buildContextMemoryTail: (...args: any[]) => any;
	buildEvidenceDigest: (...args: any[]) => any;
	buildMemoryActiveKernelReport: (...args: any[]) => any;
	buildMemoryDepositionReport: (...args: any[]) => any;
	buildMemoryDistillPromotionReport: (...args: any[]) => any;
	buildMemoryExperienceReport: (...args: any[]) => any;
	buildMemoryMaturationRuntimeReport: (...args: any[]) => any;
	buildMemoryOrchestratorReport: (...args: any[]) => any;
	buildMemoryQualityLedgerReport: (...args: any[]) => any;
	buildMemoryReplayEvaluatorReport: (...args: any[]) => any;
	buildMemorySkillCapsuleReport: (...args: any[]) => any;
	buildMemoryStrategyCapsuleReport: (...args: any[]) => any;
	buildToolDigest: (...args: any[]) => any;
	caseMemoryOperatorCommands: (...args: any[]) => any;
	contextBranchId: (...args: any[]) => any;
	contextCompactionLedger: (...args: any[]) => any;
	contextSessionId: (...args: any[]) => any;
	currentCaseMemoryLanePlan: (...args: any[]) => any;
	formatCompactResumeLedgerV2: (...args: any[]) => any;
	formatCompletionAudit: (...args: any[]) => any;
	formatMission: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	latestSwarmRetryQueue: (...args: any[]) => any;
	memoryOrchestratorPhaseCommand: (...args: any[]) => any;
	parseReflectionArtifact: (...args: any[]) => any;
	parseSupervisorArtifact: (...args: any[]) => any;
	rotateCompactionResumeLedgerIfNeeded: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	verifyContextPackResume: (...args: any[]) => any;

	contextRefLooksExplicit?: (...args: any[]) => any;

	parseContextPackArtifact?: (...args: any[]) => any;
};
