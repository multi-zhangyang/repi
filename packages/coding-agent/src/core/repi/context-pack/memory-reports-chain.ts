/** Optional memory report chain (active kernel + maturation). */
// Landmark: buildMemoryActiveKernelChain buildMemoryMaturationChain

export function buildMemoryActiveKernelChain(input: {
	includeMemoryRuntimeReports: boolean;
	activeRecall?: boolean;
	route?: string;
	target?: string;
	memoryQuality: any;
	memoryReplay: any;
	memoryStrategy: any;
	buildMemoryActiveKernelReport: (...args: any[]) => any;
}): any {
	const {
		includeMemoryRuntimeReports,
		activeRecall,
		route,
		target,
		memoryQuality,
		memoryReplay,
		memoryStrategy,
		buildMemoryActiveKernelReport,
	} = input;
	return includeMemoryRuntimeReports && activeRecall && memoryQuality && memoryReplay && memoryStrategy
		? buildMemoryActiveKernelReport({
				write: true,
				route,
				target,
				quality: memoryQuality,
				replay: memoryReplay,
				strategy: memoryStrategy,
			})
		: undefined;
}

export function buildMemoryMaturationChain(input: {
	includeMemoryRuntimeReports: boolean;
	activeRecall?: boolean;
	route?: string;
	target?: string;
	memoryQuality: any;
	memoryReplay: any;
	memoryStrategy: any;
	memoryActiveKernel: any;
	memoryDeposition: any;
	memoryExperience: any;
	memorySkillCapsules: any;
	memoryDistillPromotion: any;
	buildMemoryMaturationRuntimeReport: (...args: any[]) => any;
}): any {
	const {
		includeMemoryRuntimeReports,
		activeRecall,
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
	} = input;
	return includeMemoryRuntimeReports &&
		activeRecall &&
		memoryQuality &&
		memoryReplay &&
		memoryStrategy &&
		memoryActiveKernel &&
		memoryDeposition &&
		memoryExperience &&
		memorySkillCapsules &&
		memoryDistillPromotion
		? buildMemoryMaturationRuntimeReport({
				write: true,
				route,
				target,
				quality: memoryQuality,
				replay: memoryReplay,
				strategy: memoryStrategy,
				active: memoryActiveKernel,
				deposition: memoryDeposition,
				experience: memoryExperience,
				skillCapsules: memorySkillCapsules,
				distillPromotion: memoryDistillPromotion,
			})
		: undefined;
}
