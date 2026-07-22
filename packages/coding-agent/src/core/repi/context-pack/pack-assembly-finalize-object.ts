// nextCommands: mergedNextCommands
/** Context-pack artifact object construction. */
import { buildContextPackCoreFields } from "./pack-assembly-finalize-object-core.ts";
import { unpackContextPackMemoryReports } from "./pack-assembly-finalize-object-memory.ts";
import { buildContextPackSecondaryFields } from "./pack-assembly-finalize-object-pack.ts";
import type { ContextPackArtifact } from "./types.ts";
export function buildContextPackArtifactObject(input: {
	// buildContextPackResumeContract
	mission: any;
	active: any;
	route: any;
	target: any;
	mode: any;
	timestamp: string;
	scope: any;
	contextPath: any;
	idempotencyKey: any;
	closure: any;
	compactionLedger: any;
	resumeBrief: any;
	mergedNextCommands: string[];
	checkSummary: any;
	repairQueue: any;
	commanderMergeBudget: any;
	workerScoreboard: any;
	swarmRetryQueue: any;
	autonomousBudget: any;
	caseMemoryPlan: any;
	caseMemoryNextCommands: any;
	reflectionReuseRules: any;
	swarmRetry: any;
	reflection: any;
	supervisor: any;
	formatMission: any;
	buildToolDigest: any;
	formatCompletionAudit: any;
	memoryOrchestrator: any;
	compactResumeLedgerV2: any;
	memoryReports: any;
	contextEvidenceTail: any;
	contextMemoryTail: any;
	artifactIndex: any;
	artifactScopeFilter: any;
	artifactHashes: any;
	resumeArtifactHashes: any;
	compactionResumeTelemetryPath?: any;
}): any {
	const {
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
		mergedNextCommands,
		checkSummary,
		repairQueue,
		commanderMergeBudget,
		workerScoreboard,
		swarmRetryQueue,
		autonomousBudget,
		caseMemoryPlan,
		caseMemoryNextCommands,
		reflectionReuseRules,
		swarmRetry,
		reflection,
		supervisor,
		formatMission,
		buildToolDigest,
		formatCompletionAudit,
		memoryOrchestrator,
		compactResumeLedgerV2,
		memoryReports,
		contextEvidenceTail,
		contextMemoryTail,
		artifactIndex,
		artifactScopeFilter,
		artifactHashes,
		resumeArtifactHashes,
	} = input;
	const memoryFields = unpackContextPackMemoryReports(memoryReports);
	const pack = {
		...buildContextPackCoreFields({
			mission,
			route,
			target,
			mode,
			timestamp,
			scope,
			contextPath,
			idempotencyKey,
			closure,
			compactionLedger,
			resumeArtifactHashes,
			autonomousBudget,
			active,
			checkSummary,
			formatMission,
			contextEvidenceTail,
			contextMemoryTail,
			buildToolDigest,
			formatCompletionAudit,
			artifactIndex,
			artifactScopeFilter,
			artifactHashes,
		}),
		...buildContextPackSecondaryFields({
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
			compactionResumeTelemetryPath: input.compactionResumeTelemetryPath,
		}),
	};
	return pack as ContextPackArtifact;
}
export { buildContextPackResumeContract } from "./pack-assembly-finalize-object-resume.ts";
