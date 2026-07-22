/** Assemble non-core context-pack fields after memory unpack. */
import { collectFinalizeObjectSourceArtifacts } from "./pack-assembly-finalize-object-sources.ts";

export function buildContextPackSecondaryFields(input: {
	mission: any;
	reflection: any;
	supervisor: any;
	memoryOrchestrator: any;
	memoryFields: any;
	compactResumeLedgerV2: any;
	repairQueue: any;
	commanderMergeBudget: any;
	workerScoreboard: any;
	swarmRetryQueue: any;
	autonomousBudget: any;
	caseMemoryPlan: any;
	caseMemoryNextCommands: any;
	reflectionReuseRules: any;
	resumeBrief: any;
	mergedNextCommands: string[];
	artifactIndex: any;
	swarmRetry: any;
	compactionResumeTelemetryPath?: any;
}): Record<string, any> {
	const {
		mission,
		reflection,
		supervisor,
		memoryOrchestrator,
		memoryFields,
		compactResumeLedgerV2,
		repairQueue,
		commanderMergeBudget,
		workerScoreboard,
		swarmRetryQueue,
		autonomousBudget,
		caseMemoryPlan,
		caseMemoryNextCommands,
		reflectionReuseRules,
		resumeBrief,
		mergedNextCommands,
		artifactIndex,
		swarmRetry,
		compactionResumeTelemetryPath,
	} = input;
	const {
		memoryDeposition,
		memoryExperience,
		memorySkillCapsules,
		memoryDistillPromotion,
		memoryQuality,
		memoryReplay,
		memoryStrategy,
		memoryActiveKernel,
		memoryMaturation,
	} = memoryFields;
	return {
		missionId: mission?.id ?? reflection?.missionId ?? supervisor?.missionId,
		memoryOrchestrator,
		...memoryFields,
		compactResumeLedgerV2,
		repairQueue,
		commanderMergeBudget,
		workerScoreboard,
		swarmRetryQueue,
		autonomousBudget,
		dispatcherScoreDecay: autonomousBudget.scoreDecay,
		repeatedFailureDemotions: autonomousBudget.demotionRules,
		highScorePromotions: autonomousBudget.promotionRules,
		caseMemoryLanePlan: caseMemoryPlan,
		caseMemoryNextCommands,
		reflectionReuseRules,
		resumeBrief,
		nextCommands: mergedNextCommands,
		sourceArtifacts: collectFinalizeObjectSourceArtifacts({
			artifactIndex,
			swarmRetry,
			autonomousBudget,
			compactionResumeTelemetryPath,
			memoryOrchestrator,
			memoryDeposition,
			memoryExperience,
			memorySkillCapsules,
			memoryDistillPromotion,
			memoryQuality,
			memoryReplay,
			memoryStrategy,
			memoryActiveKernel,
			memoryMaturation,
			compactResumeLedgerV2,
		}),
	};
}
