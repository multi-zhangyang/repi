/** Proof-loop runtime deps bus. */
import type { ProofLoopDeps } from "./types.ts";

let proofLoopDeps: ProofLoopDeps | null = null;

export function configureProofLoop(deps: ProofLoopDeps): void {
	proofLoopDeps = deps;
}

export function d(): ProofLoopDeps {
	if (!proofLoopDeps) throw new Error("proof-loop not configured; call configureProofLoop() from REPI kernel init");
	return proofLoopDeps;
}

export function appendEvidence(...args: any[]): any {
	return d().appendEvidence(...args);
}
export function appendProofLoopMemoryEvent(...args: any[]): any {
	return d().appendProofLoopMemoryEvent(...args);
}
export function appendRuntimeFailureRepairFromProofLoop(...args: any[]): any {
	return d().appendRuntimeFailureRepairFromProofLoop(...args);
}
export function autonomousExecutionBudget(...args: any[]): any {
	return d().autonomousExecutionBudget(...args);
}
export function buildProofLoopSteps(...args: any[]): any {
	return d().buildProofLoopSteps(...args);
}
export function executeProofLoopBridgeStep(...args: any[]): any {
	return d().executeProofLoopBridgeStep(...args);
}
export function executeProofLoopQuickPathCommand(...args: any[]): any {
	return d().executeProofLoopQuickPathCommand(...args);
}
export function executeProofLoopStep(...args: any[]): any {
	return d().executeProofLoopStep(...args);
}
export function latestScopedMarkdownArtifact(...args: any[]): any {
	return d().latestScopedMarkdownArtifact(...args);
}
export function proofLoopSourceArtifacts(...args: any[]): any {
	return d().proofLoopSourceArtifacts(...args);
}
export function readCurrentMission(...args: any[]): any {
	return d().readCurrentMission(...args);
}
export function refreshProofLoop(...args: any[]): any {
	return d().refreshProofLoop(...args);
}
export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}
export function updateReconCompactionTelemetryFromExecutions(...args: any[]): any {
	return d().updateReconCompactionTelemetryFromExecutions(...args);
}
export function withScopedMarkdownArtifactSelectionCache(...args: any[]): any {
	return d().withScopedMarkdownArtifactSelectionCache(...args);
}
