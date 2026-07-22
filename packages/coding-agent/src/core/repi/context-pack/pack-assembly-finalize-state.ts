/** Context-pack finalize: memory reports + artifact index state. */

import { scopedContextArtifactIndex } from "./artifact-index.ts";
import { buildContextPackMemoryReports } from "./memory-reports.ts";

export function collectContextPackFinalizeState(input: any): {
	compactResumeLedgerV2: any;
	memoryReports: any;
	contextEvidenceTail: any;
	contextMemoryTail: any;
	artifactIndex: any;
	artifactScopeFilter: any;
	artifactHashes: any;
	resumeArtifactHashes: any;
} {
	const {
		route,
		target,
		includeMemoryRuntimeReports,
		memorySettings,
		buildMemoryDepositionReport,
		buildMemoryExperienceReport,
		buildMemorySkillCapsuleReport,
		buildMemoryDistillPromotionReport,
		buildMemoryQualityLedgerReport,
		buildMemoryReplayEvaluatorReport,
		buildMemoryStrategyCapsuleReport,
		buildMemoryActiveKernelReport,
		buildMemoryMaturationRuntimeReport,
		buildContextEvidenceTail,
		buildContextMemoryTail,
		contextArtifactHashes,
		buildCompactResumeLedgerV2Report,
	} = input;

	const compactResumeLedgerV2 = buildCompactResumeLedgerV2Report({ write: true });
	const memoryReports = buildContextPackMemoryReports({
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
	});
	const contextEvidenceTail = buildContextEvidenceTail({ target });
	const contextMemoryTail = buildContextMemoryTail({ route, target });
	const artifactSelection = scopedContextArtifactIndex({ target, route, requestedBy: "context_artifact_index" });
	const artifactIndex = artifactSelection.entries;
	const artifactScopeFilter = artifactSelection.artifactScopeFilter;
	const artifactHashes = contextArtifactHashes(artifactIndex);
	const resumeArtifactHashes = artifactHashes
		.filter((artifact: any) => Boolean(artifact.required && artifact.sha256))
		.slice(0, 96);
	return {
		compactResumeLedgerV2,
		memoryReports,
		contextEvidenceTail,
		contextMemoryTail,
		artifactIndex,
		artifactScopeFilter,
		artifactHashes,
		resumeArtifactHashes,
	};
}
