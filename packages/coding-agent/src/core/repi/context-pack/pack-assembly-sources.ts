/** Context-pack sourceArtifacts collector (memory report paths lean/opt-in). */
export function collectContextPackSourceArtifacts(input: {
	artifactIndex: Array<{ exists?: boolean; path: string }>;
	swarmRetry: { path?: string };
	autonomousBudget: any;
	compactionResumeTelemetryPath: () => string;
	memoryOrchestrator?: any;
	memoryDeposition?: any;
	memoryExperience?: any;
	memorySkillCapsules?: any;
	memoryDistillPromotion?: any;
	memoryQuality?: any;
	memoryReplay?: any;
	memoryStrategy?: any;
	memoryActiveKernel?: any;
	memoryMaturation?: any;
	compactResumeLedgerV2: any;
	existsSync: (path: string) => boolean;
}): string[] {
	const {
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
		existsSync,
	} = input;
	return Array.from(
		new Set(
			[
				...artifactIndex.filter((artifact: any) => artifact.exists).map((artifact: any) => artifact.path),
				swarmRetry.path,
				autonomousBudget.dispatcherBoardPath,
				autonomousBudget.promotionPlaybookPath,
				autonomousBudget.ledgerPath,
				autonomousBudget.formalPlaybookPath,
				existsSync(compactionResumeTelemetryPath()) ? compactionResumeTelemetryPath() : undefined,
				memoryOrchestrator?.reportPath && existsSync(memoryOrchestrator.reportPath)
					? memoryOrchestrator.reportPath
					: undefined,
				memoryDeposition?.depositionReportPath && existsSync(memoryDeposition.depositionReportPath)
					? memoryDeposition.depositionReportPath
					: undefined,
				memoryDeposition?.depositionEventBusPath && existsSync(memoryDeposition.depositionEventBusPath)
					? memoryDeposition.depositionEventBusPath
					: undefined,
				memoryExperience?.reportPath && existsSync(memoryExperience.reportPath)
					? memoryExperience.reportPath
					: undefined,
				memoryExperience?.lessonBookPath && existsSync(memoryExperience.lessonBookPath)
					? memoryExperience.lessonBookPath
					: undefined,
				memorySkillCapsules?.reportPath && existsSync(memorySkillCapsules.reportPath)
					? memorySkillCapsules.reportPath
					: undefined,
				memorySkillCapsules?.capsuleBookPath && existsSync(memorySkillCapsules.capsuleBookPath)
					? memorySkillCapsules.capsuleBookPath
					: undefined,
				memorySkillCapsules?.capsuleLedgerPath && existsSync(memorySkillCapsules.capsuleLedgerPath)
					? memorySkillCapsules.capsuleLedgerPath
					: undefined,
				memoryDistillPromotion?.reportPath && existsSync(memoryDistillPromotion.reportPath)
					? memoryDistillPromotion.reportPath
					: undefined,
				memoryDistillPromotion?.promotionBookPath && existsSync(memoryDistillPromotion.promotionBookPath)
					? memoryDistillPromotion.promotionBookPath
					: undefined,
				memoryDistillPromotion?.candidateLedgerPath && existsSync(memoryDistillPromotion.candidateLedgerPath)
					? memoryDistillPromotion.candidateLedgerPath
					: undefined,
				memoryQuality?.reportPath && existsSync(memoryQuality.reportPath) ? memoryQuality.reportPath : undefined,
				memoryQuality?.boardPath && existsSync(memoryQuality.boardPath) ? memoryQuality.boardPath : undefined,
				memoryQuality?.ledgerPath && existsSync(memoryQuality.ledgerPath) ? memoryQuality.ledgerPath : undefined,
				memoryReplay?.reportPath && existsSync(memoryReplay.reportPath) ? memoryReplay.reportPath : undefined,
				memoryReplay?.boardPath && existsSync(memoryReplay.boardPath) ? memoryReplay.boardPath : undefined,
				memoryReplay?.ledgerPath && existsSync(memoryReplay.ledgerPath) ? memoryReplay.ledgerPath : undefined,
				memoryStrategy?.reportPath && existsSync(memoryStrategy.reportPath) ? memoryStrategy.reportPath : undefined,
				memoryStrategy?.strategyBookPath && existsSync(memoryStrategy.strategyBookPath)
					? memoryStrategy.strategyBookPath
					: undefined,
				memoryStrategy?.capsuleLedgerPath && existsSync(memoryStrategy.capsuleLedgerPath)
					? memoryStrategy.capsuleLedgerPath
					: undefined,
				memoryActiveKernel?.reportPath && existsSync(memoryActiveKernel.reportPath)
					? memoryActiveKernel.reportPath
					: undefined,
				memoryActiveKernel?.injectionPackPath && existsSync(memoryActiveKernel.injectionPackPath)
					? memoryActiveKernel.injectionPackPath
					: undefined,
				memoryActiveKernel?.strategyBoardPath && existsSync(memoryActiveKernel.strategyBoardPath)
					? memoryActiveKernel.strategyBoardPath
					: undefined,
				memoryMaturation?.reportPath && existsSync(memoryMaturation.reportPath)
					? memoryMaturation.reportPath
					: undefined,
				memoryMaturation?.ledgerPath && existsSync(memoryMaturation.ledgerPath)
					? memoryMaturation.ledgerPath
					: undefined,
				memoryMaturation?.actionBoardPath && existsSync(memoryMaturation.actionBoardPath)
					? memoryMaturation.actionBoardPath
					: undefined,
				existsSync(compactResumeLedgerV2.reportPath) ? compactResumeLedgerV2.reportPath : undefined,
				existsSync(compactResumeLedgerV2.transitionPath) ? compactResumeLedgerV2.transitionPath : undefined,
			].filter(Boolean) as string[],
		),
	);
}
