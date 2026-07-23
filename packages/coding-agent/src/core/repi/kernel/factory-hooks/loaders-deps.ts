/** Factory session hook deps bag (_hookDeps). */
// Landmark: _hookDeps loadMission loadRoutes softband facade
import { auditCompletion, formatCompletionAudit } from "../../completion-audit.ts";
import { buildStartupContextDigest, buildStartupEvidenceDigest } from "../../evidence.ts";
import {
	allowNoSessionReconWriteback,
	getBashCommand,
	getToolResultCommand,
	makeSelfReview,
} from "../session-helpers.ts";
import {
	buildReconCompactionAutoResume,
	buildReconCompactionDetails,
	buildReconCompactionResumeContract,
	buildReconCompactionSummary,
	initialReconCompactionResumeTelemetry,
	reconCompactionAutoResumePrompt,
	writeReconCompactionResumeTelemetry,
} from "./loaders-compact.ts";
import {
	buildContextEvidenceTail,
	buildContextPack,
	buildDecisionCoreOutput,
	buildKernelOutput,
	writeContextPackArtifact,
} from "./loaders-context.ts";
import {
	loadMission,
	loadResources,
	loadRoutes,
	loadTechniques,
	loadText,
	loadToolIndex,
	loadToolTrace,
} from "./loaders-deps-core.ts";
import {
	appendMemoryDepositionRuntimeEvent,
	buildPerTurnMemoryRecall,
	repiMemorySettings,
	shouldAutoDepositToolResult,
} from "./loaders-memory.ts";

export const _hookDeps = {
	allowNoSessionReconWriteback,
	auditCompletion,
	appendMemoryDepositionRuntimeEvent,
	appendToolCallTraceFromCall: (...args: any[]) => loadToolTrace().appendToolCallTraceFromCall(...args),
	appendToolCallTraceFromResult: (...args: any[]) => loadToolTrace().appendToolCallTraceFromResult(...args),
	buildContextEvidenceTail,
	buildContextPack,
	buildDecisionCoreOutput,
	buildKernelOutput,
	buildMissionDigest: (...args: any[]) => loadMission().buildMissionDigest(...args),
	buildPerTurnMemoryRecall,
	buildReconCompactionAutoResume,
	buildReconCompactionDetails,
	buildReconCompactionResumeContract,
	buildReconCompactionSummary,
	buildStartupContextDigest,
	buildStartupEvidenceDigest,
	buildToolDigest: (...args: any[]) => loadToolIndex().buildToolDigest(...args),
	createMission: (...args: any[]) => loadMission().createMission(...args),
	ensureReconStorage: (...args: any[]) => loadResources().ensureReconStorage(...args),
	formatCompletionAudit,
	formatRoute: (...args: any[]) => loadRoutes().formatRoute(...args),
	getBashCommand,
	getToolResultCommand,
	initialReconCompactionResumeTelemetry,
	isSecurityTask: (...args: any[]) => loadRoutes().isSecurityTask(...args),
	makeSelfReview,
	readCurrentMission: (...args: any[]) => loadMission().readCurrentMission(...args),
	reconCompactionAutoResumePrompt,
	repiMemorySettings,
	routeReconTask: (...args: any[]) => loadRoutes().routeReconTask(...args),
	shouldAutoDepositToolResult,
	techniqueIdsForRoute: (...args: any[]) => loadTechniques().techniqueIdsForRoute(...args),
	textBlocksToString: (...args: any[]) => loadToolTrace().textBlocksToString(...args),
	truncateMiddle: (...args: any[]) => loadText().truncateMiddle(...args),
	updateMissionCheckpoint: (...args: any[]) => loadMission().updateMissionCheckpoint(...args),
	writeContextPackArtifact,
	writeCurrentMission: (...args: any[]) => loadMission().writeCurrentMission(...args),
	writeReconCompactionResumeTelemetry,
} as Record<string, any>;
