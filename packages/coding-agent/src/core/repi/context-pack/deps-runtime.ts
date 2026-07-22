/** Context-pack DI runtime/control passthroughs. */
import { d } from "./deps-core.ts";

export function activeLane(...args: any[]): any {
	return d().activeLane(...args);
}

export function appendCompactResumeTransition(...args: any[]): any {
	return d().appendCompactResumeTransition(...args);
}

export function appendEvidence(...args: any[]): any {
	return d().appendEvidence(...args);
}

export function artifactScopeInferTarget(...args: any[]): any {
	return d().artifactScopeInferTarget(...args);
}

export function autonomousExecutionBudget(...args: any[]): any {
	return d().autonomousExecutionBudget(...args);
}

export function buildCompactResumeLedgerV2Report(...args: any[]): any {
	return d().buildCompactResumeLedgerV2Report(...args);
}

export function buildContextEvidenceTail(...args: any[]): any {
	return d().buildContextEvidenceTail(...args);
}

export function buildEvidenceDigest(...args: any[]): any {
	return d().buildEvidenceDigest(...args);
}

export function buildToolDigest(...args: any[]): any {
	return d().buildToolDigest(...args);
}

export function contextBranchId(...args: any[]): any {
	return d().contextBranchId(...args);
}

export function contextCompactionLedger(...args: any[]): any {
	return d().contextCompactionLedger(...args);
}

export function contextSessionId(...args: any[]): any {
	return d().contextSessionId(...args);
}

export function formatCompactResumeLedgerV2(...args: any[]): any {
	return d().formatCompactResumeLedgerV2(...args);
}

export function formatCompletionAudit(...args: any[]): any {
	return d().formatCompletionAudit(...args);
}

export function formatMission(...args: any[]): any {
	return d().formatMission(...args);
}

export function latestScopedMarkdownArtifact(...args: any[]): any {
	return d().latestScopedMarkdownArtifact(...args);
}

export function latestSwarmRetryQueue(...args: any[]): any {
	return d().latestSwarmRetryQueue(...args);
}

export function parseReflectionArtifact(...args: any[]): any {
	return d().parseReflectionArtifact(...args);
}

export function parseSupervisorArtifact(...args: any[]): any {
	return d().parseSupervisorArtifact(...args);
}

export function rotateCompactionResumeLedgerIfNeeded(...args: any[]): any {
	return d().rotateCompactionResumeLedgerIfNeeded(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}

export function verifyContextPackResume(...args: any[]): any {
	return d().verifyContextPackResume(...args);
}
