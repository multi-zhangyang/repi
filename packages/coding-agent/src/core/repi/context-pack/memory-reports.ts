/** Optional context-pack memory runtime report assembly (opt-in stubs). */
// Landmark: buildContextPackMemoryReports
import { buildMemoryActiveKernelChain, buildMemoryMaturationChain } from "./memory-reports-chain.ts";

export function buildContextPackMemoryReports(input: {
	includeMemoryRuntimeReports: boolean;
	memorySettings: { activeRecall?: boolean };
	route?: string;
	target?: string;
	buildMemoryDepositionReport: (...args: any[]) => any;
	buildMemoryExperienceReport: (...args: any[]) => any;
	buildMemorySkillCapsuleReport: (...args: any[]) => any;
	buildMemoryDistillPromotionReport: (...args: any[]) => any;
	buildMemoryQualityLedgerReport: (...args: any[]) => any;
	buildMemoryReplayEvaluatorReport: (...args: any[]) => any;
	buildMemoryStrategyCapsuleReport: (...args: any[]) => any;
	buildMemoryActiveKernelReport: (...args: any[]) => any;
	buildMemoryMaturationRuntimeReport: (...args: any[]) => any;
}): {
	memoryDeposition: any;
	memoryExperience: any;
	memorySkillCapsules: any;
	memoryDistillPromotion: any;
	memoryQuality: any;
	memoryReplay: any;
	memoryStrategy: any;
	memoryActiveKernel: any;
	memoryMaturation: any;
} {
	const {
		includeMemoryRuntimeReports,
		memorySettings,
		route,
		target,
		buildMemoryDepositionReport,
		buildMemoryExperienceReport,
		buildMemorySkillCapsuleReport,
		buildMemoryDistillPromotionReport,
		buildMemoryQualityLedgerReport,
		buildMemoryReplayEvaluatorReport,
		buildMemoryStrategyCapsuleReport,
		buildMemoryActiveKernelReport,
		buildMemoryMaturationRuntimeReport,
	} = input;
	const memoryDeposition = includeMemoryRuntimeReports ? buildMemoryDepositionReport({ write: true }) : undefined;
	const memoryExperience = includeMemoryRuntimeReports
		? buildMemoryExperienceReport({ write: true, route, target })
		: undefined;
	const memorySkillCapsules = includeMemoryRuntimeReports
		? buildMemorySkillCapsuleReport({ write: true, route, target })
		: undefined;
	const memoryDistillPromotion = includeMemoryRuntimeReports
		? buildMemoryDistillPromotionReport({ write: true, route, target })
		: undefined;
	const memoryQuality = includeMemoryRuntimeReports
		? buildMemoryQualityLedgerReport({ write: true, route, target })
		: undefined;
	const memoryReplay =
		includeMemoryRuntimeReports && memoryQuality
			? buildMemoryReplayEvaluatorReport({ write: true, route, target, quality: memoryQuality })
			: undefined;
	const memoryStrategy =
		includeMemoryRuntimeReports && memoryQuality && memoryReplay && memorySkillCapsules
			? buildMemoryStrategyCapsuleReport({
					write: true,
					route,
					target,
					quality: memoryQuality,
					replay: memoryReplay,
					skillCapsules: memorySkillCapsules,
				})
			: undefined;
	const memoryActiveKernel = buildMemoryActiveKernelChain({
		includeMemoryRuntimeReports,
		activeRecall: memorySettings.activeRecall,
		route,
		target,
		memoryQuality,
		memoryReplay,
		memoryStrategy,
		buildMemoryActiveKernelReport,
	});
	const memoryMaturation = buildMemoryMaturationChain({
		includeMemoryRuntimeReports,
		activeRecall: memorySettings.activeRecall,
		route,
		target,
		memoryQuality,
		memoryReplay,
		memoryStrategy,
		memoryActiveKernel,
		memoryDeposition,
		memoryExperience,
		memorySkillCapsules,
		memoryDistillPromotion,
		buildMemoryMaturationRuntimeReport,
	});
	return {
		memoryDeposition,
		memoryExperience,
		memorySkillCapsules,
		memoryDistillPromotion,
		memoryQuality,
		memoryReplay,
		memoryStrategy,
		memoryActiveKernel,
		memoryMaturation,
	};
}
