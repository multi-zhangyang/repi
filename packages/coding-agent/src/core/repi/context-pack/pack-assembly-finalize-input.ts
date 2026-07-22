/** Build finalizeContextPackArtifact input bag from assembly state. */
export function buildContextPackFinalizeInput(params: {
	input: any;
	mission: any;
	active: any;
	route: any;
	target: any;
	mode: any;
	timestamp: any;
	scope: any;
	contextPath: any;
	idempotencyKey: string;
	closure: any;
	compactionLedger: any;
	resumeBrief: any;
	nextCommands: string[];
}): any {
	const {
		input,
		mission,
		active,
		route,
		target,
		mode,
		timestamp,
		scope,
		contextPath,
		idempotencyKey,
		closure,
		compactionLedger,
		resumeBrief,
		nextCommands,
	} = params;
	return {
		...input,
		mission,
		active,
		route,
		target,
		mode,
		timestamp,
		scope,
		contextPath,
		idempotencyKey,
		closure,
		compactionLedger,
		resumeBrief,
		nextCommands,
		checkSummary: input.checkSummary,
		repairQueue: input.repairQueue,
		commanderMergeBudget: input.commanderMergeBudget,
		workerScoreboard: input.workerScoreboard,
		swarmRetryQueue: input.swarmRetryQueue,
		autonomousBudget: input.autonomousBudget,
		caseMemoryPlan: input.caseMemoryPlan,
		caseMemoryNextCommands: input.caseMemoryNextCommands,
		reflectionReuseRules: input.reflectionReuseRules,
		includeMemoryRuntimeReports: input.includeMemoryRuntimeReports,
		memorySettings: input.memorySettings,
		swarmRetry: input.swarmRetry,
		reflection: input.reflection,
		supervisor: input.supervisor,
		formatMission: input.formatMission,
		buildMemoryDepositionReport: input.buildMemoryDepositionReport,
		buildMemoryExperienceReport: input.buildMemoryExperienceReport,
		buildMemorySkillCapsuleReport: input.buildMemorySkillCapsuleReport,
		buildMemoryDistillPromotionReport: input.buildMemoryDistillPromotionReport,
		buildMemoryQualityLedgerReport: input.buildMemoryQualityLedgerReport,
		buildMemoryReplayEvaluatorReport: input.buildMemoryReplayEvaluatorReport,
		buildMemoryStrategyCapsuleReport: input.buildMemoryStrategyCapsuleReport,
		buildMemoryActiveKernelReport: input.buildMemoryActiveKernelReport,
		buildMemoryMaturationRuntimeReport: input.buildMemoryMaturationRuntimeReport,
		buildContextEvidenceTail: input.buildContextEvidenceTail,
		buildContextMemoryTail: input.buildContextMemoryTail,
		contextArtifactHashes: input.contextArtifactHashes,
		contextPackSha256: input.contextPackSha256,
		buildToolDigest: input.buildToolDigest,
		formatCompletionAudit: input.formatCompletionAudit,
		memoryOrchestrator: input.memoryOrchestrator,
		buildCompactResumeLedgerV2Report: input.buildCompactResumeLedgerV2Report,
		compactionResumeTelemetryPath: input.compactionResumeTelemetryPath,
	};
}
