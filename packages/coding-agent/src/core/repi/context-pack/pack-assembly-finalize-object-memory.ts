/** Context-pack memory report field unpack for finalize object. */
export function unpackContextPackMemoryReports(memoryReports: any): {
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
	return {
		memoryDeposition: memoryReports.memoryDeposition,
		memoryExperience: memoryReports.memoryExperience,
		memorySkillCapsules: memoryReports.memorySkillCapsules,
		memoryDistillPromotion: memoryReports.memoryDistillPromotion,
		memoryQuality: memoryReports.memoryQuality,
		memoryReplay: memoryReports.memoryReplay,
		memoryStrategy: memoryReports.memoryStrategy,
		memoryActiveKernel: memoryReports.memoryActiveKernel,
		memoryMaturation: memoryReports.memoryMaturation,
	};
}
