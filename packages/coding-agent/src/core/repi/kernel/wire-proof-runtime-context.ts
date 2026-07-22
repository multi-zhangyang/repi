/** Wire-proof: configureContextPack bag. */

import { artifactScopeInferTarget, latestScopedMarkdownArtifact } from "../artifact-scope.ts";
import { verifyContextPackResume } from "../compact-resume.ts";
import { formatCompletionAudit } from "../completion-audit.ts";
import { configureContextPack, contextRefLooksExplicit, parseContextPackArtifact } from "../context-pack.ts";
import { appendEvidence, buildEvidenceDigest } from "../evidence.ts";
import {
	appendCompactResumeTransition,
	buildCompactResumeLedgerV2Report,
	buildContextMemoryTail,
	buildMemoryActiveKernelReport,
	buildMemoryDepositionReport,
	buildMemoryDistillPromotionReport,
	buildMemoryExperienceReport,
	buildMemoryMaturationRuntimeReport,
	buildMemoryOrchestratorReport,
	buildMemoryQualityLedgerReport,
	buildMemoryReplayEvaluatorReport,
	buildMemorySkillCapsuleReport,
	buildMemoryStrategyCapsuleReport,
	caseMemoryOperatorCommands,
	contextBranchId,
	contextCompactionLedger,
	contextSessionId,
	currentCaseMemoryLanePlan,
	formatCompactResumeLedgerV2,
	memoryOrchestratorPhaseCommand,
	rotateCompactionResumeLedgerIfNeeded,
} from "../memory-stubs.ts";
import { activeLane, formatMission, updateMissionCheckpoint } from "../mission.ts";
import { autonomousExecutionBudget } from "../operator-runtime.ts";
import { buildContextEvidenceTail } from "../pentesting-task-tree.ts";
import { parseReflectionArtifact } from "../reflection.ts";
import { parseSupervisorArtifact } from "../supervisor.ts";
import { latestSwarmRetryQueue } from "../swarm-runtime.ts";
import { buildToolDigest } from "../tool-index.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireProofRuntimeContextModules(pick: PickFn): void {
	configureContextPack({
		activeLane: pick("activeLane", activeLane),
		appendCompactResumeTransition: pick("appendCompactResumeTransition", appendCompactResumeTransition),
		appendEvidence: pick("appendEvidence", appendEvidence),
		artifactScopeInferTarget: pick("artifactScopeInferTarget", artifactScopeInferTarget),
		autonomousExecutionBudget: pick("autonomousExecutionBudget", autonomousExecutionBudget),
		buildCompactResumeLedgerV2Report: pick("buildCompactResumeLedgerV2Report", buildCompactResumeLedgerV2Report),
		buildContextEvidenceTail: pick("buildContextEvidenceTail", buildContextEvidenceTail),
		buildContextMemoryTail: pick("buildContextMemoryTail", buildContextMemoryTail),
		buildEvidenceDigest: pick("buildEvidenceDigest", buildEvidenceDigest),
		buildMemoryActiveKernelReport: pick("buildMemoryActiveKernelReport", buildMemoryActiveKernelReport),
		buildMemoryDepositionReport: pick("buildMemoryDepositionReport", buildMemoryDepositionReport),
		buildMemoryDistillPromotionReport: pick("buildMemoryDistillPromotionReport", buildMemoryDistillPromotionReport),
		buildMemoryExperienceReport: pick("buildMemoryExperienceReport", buildMemoryExperienceReport),
		buildMemoryMaturationRuntimeReport: pick(
			"buildMemoryMaturationRuntimeReport",
			buildMemoryMaturationRuntimeReport,
		),
		buildMemoryOrchestratorReport: pick("buildMemoryOrchestratorReport", buildMemoryOrchestratorReport),
		buildMemoryQualityLedgerReport: pick("buildMemoryQualityLedgerReport", buildMemoryQualityLedgerReport),
		buildMemoryReplayEvaluatorReport: pick("buildMemoryReplayEvaluatorReport", buildMemoryReplayEvaluatorReport),
		buildMemorySkillCapsuleReport: pick("buildMemorySkillCapsuleReport", buildMemorySkillCapsuleReport),
		buildMemoryStrategyCapsuleReport: pick("buildMemoryStrategyCapsuleReport", buildMemoryStrategyCapsuleReport),
		buildToolDigest: pick("buildToolDigest", buildToolDigest),
		caseMemoryOperatorCommands: pick("caseMemoryOperatorCommands", caseMemoryOperatorCommands),
		contextBranchId: pick("contextBranchId", contextBranchId),
		contextCompactionLedger: pick("contextCompactionLedger", contextCompactionLedger),
		contextRefLooksExplicit: pick("contextRefLooksExplicit", contextRefLooksExplicit),
		contextSessionId: pick("contextSessionId", contextSessionId),
		currentCaseMemoryLanePlan: pick("currentCaseMemoryLanePlan", currentCaseMemoryLanePlan),
		formatCompactResumeLedgerV2: pick("formatCompactResumeLedgerV2", formatCompactResumeLedgerV2),
		formatCompletionAudit: pick("formatCompletionAudit", formatCompletionAudit),
		formatMission: pick("formatMission", formatMission),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		latestSwarmRetryQueue: pick("latestSwarmRetryQueue", latestSwarmRetryQueue),
		memoryOrchestratorPhaseCommand: pick("memoryOrchestratorPhaseCommand", memoryOrchestratorPhaseCommand),
		parseContextPackArtifact: pick("parseContextPackArtifact", parseContextPackArtifact),
		parseReflectionArtifact: pick("parseReflectionArtifact", parseReflectionArtifact),
		parseSupervisorArtifact: pick("parseSupervisorArtifact", parseSupervisorArtifact),
		rotateCompactionResumeLedgerIfNeeded: pick(
			"rotateCompactionResumeLedgerIfNeeded",
			rotateCompactionResumeLedgerIfNeeded,
		),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		verifyContextPackResume: pick("verifyContextPackResume", verifyContextPackResume),
	});
}
