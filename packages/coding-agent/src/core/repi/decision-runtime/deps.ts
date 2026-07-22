/** Decision-runtime deps bus. */
import type { DecisionRuntimeDeps } from "./types.ts";

let decisionRuntimeDeps: DecisionRuntimeDeps | null = null;

export function configureDecisionRuntime(deps: DecisionRuntimeDeps): void {
	decisionRuntimeDeps = deps;
}

export function d(): DecisionRuntimeDeps {
	if (!decisionRuntimeDeps)
		throw new Error("decision-runtime not configured; call configureDecisionRuntime() from REPI kernel init");
	return decisionRuntimeDeps;
}

export function activeLane(...args: any[]): any {
	return (d() as any).activeLane(...args);
}
export function appendEvidence(...args: any[]): any {
	return (d() as any).appendEvidence(...args);
}
export function bootstrapCatalogFor(...args: any[]): any {
	return (d() as any).bootstrapCatalogFor(...args);
}
export function commandTarget(...args: any[]): any {
	return (d() as any).commandTarget(...args);
}
export function contextArtifactIndex(...args: any[]): any {
	return (d() as any).contextArtifactIndex(...args);
}
export function executeOperatorStep(...args: any[]): any {
	return (d() as any).executeOperatorStep(...args);
}
export function latestAutofixArtifactPath(...args: any[]): any {
	return (d() as any).latestAutofixArtifactPath(...args);
}
export function latestCompilerArtifactPath(...args: any[]): any {
	return (d() as any).latestCompilerArtifactPath(...args);
}
export function latestContextPackArtifactPath(...args: any[]): any {
	return (d() as any).latestContextPackArtifactPath(...args);
}
export function latestKernelArtifactPath(...args: any[]): any {
	return (d() as any).latestKernelArtifactPath(...args);
}
export function latestKnowledgeGraphArtifactPath(...args: any[]): any {
	return (d() as any).latestKnowledgeGraphArtifactPath(...args);
}
export function latestOperatorArtifactPath(...args: any[]): any {
	return (d() as any).latestOperatorArtifactPath(...args);
}
export function latestProofLoopArtifactPath(...args: any[]): any {
	return (d() as any).latestProofLoopArtifactPath(...args);
}
export function latestReplayerArtifactPath(...args: any[]): any {
	return (d() as any).latestReplayerArtifactPath(...args);
}
export function latestScopedMarkdownArtifact(...args: any[]): any {
	return (d() as any).latestScopedMarkdownArtifact(...args);
}
export function latestVerifierArtifactPath(...args: any[]): any {
	return (d() as any).latestVerifierArtifactPath(...args);
}
export function looksLikeNaturalLanguageTarget(...args: any[]): any {
	return (d() as any).looksLikeNaturalLanguageTarget(...args);
}
export function parseToolIndex(...args: any[]): any {
	return (d() as any).parseToolIndex(...args);
}
export function recommendedToolsForRoute(...args: any[]): any {
	return (d() as any).recommendedToolsForRoute(...args);
}
export function sanitizeTargetForCommand(...args: any[]): any {
	return (d() as any).sanitizeTargetForCommand(...args);
}
export function toolIndexPath(...args: any[]): any {
	return (d() as any).toolIndexPath(...args);
}
export function updateMissionCheckpoint(...args: any[]): any {
	return (d() as any).updateMissionCheckpoint(...args);
}
export function operatorCommandConcrete(...args: any[]): any {
	return (d() as any).operatorCommandConcrete(...args);
}
export function operatorStepPriority(...args: any[]): any {
	return (d() as any).operatorStepPriority(...args);
}
export function memoryPath(...args: any[]): any {
	const fn = (d() as any).memoryPath;
	if (typeof fn === "function") return fn(...args);
	// Concrete fallback: memory product removed but path helper remains for journal/decision sources.
	const name = String(args[0] ?? "");
	const base = process.env.REPI_MEMORY_DIR || `${process.env.HOME || "/root"}/.repi/agent/recon/memory`;
	return name ? `${base.replace(/\/$/, "")}/${name}` : base;
}
