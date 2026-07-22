/** Memory builder bag for assembleContextPackArtifact input. */
// Landmark: assembleContextPackMemoryBuilders
import {
	buildMemoryActiveKernelReport,
	buildMemoryDepositionReport,
	buildMemoryDistillPromotionReport,
	buildMemoryExperienceReport,
	buildMemoryMaturationRuntimeReport,
	buildMemoryQualityLedgerReport,
	buildMemoryReplayEvaluatorReport,
	buildMemorySkillCapsuleReport,
	buildMemoryStrategyCapsuleReport,
} from "./deps.ts";

export function assembleContextPackMemoryBuilders() {
	return {
		buildMemoryDepositionReport,
		buildMemoryExperienceReport,
		buildMemorySkillCapsuleReport,
		buildMemoryDistillPromotionReport,
		buildMemoryQualityLedgerReport,
		buildMemoryReplayEvaluatorReport,
		buildMemoryStrategyCapsuleReport,
		buildMemoryActiveKernelReport,
		buildMemoryMaturationRuntimeReport,
	};
}
