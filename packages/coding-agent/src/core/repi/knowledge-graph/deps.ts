/**
 * Knowledge-graph DI deps and passthrough stubs.
 */
import type { KnowledgeGraphDeps } from "./types.ts";

export type { KnowledgeGraphDeps } from "./types.ts";

let knowledgeGraphDeps: KnowledgeGraphDeps | null = null;

export function configureKnowledgeGraph(deps: KnowledgeGraphDeps): void {
	knowledgeGraphDeps = deps;
}

export function deps(): KnowledgeGraphDeps {
	if (!knowledgeGraphDeps) {
		throw new Error("knowledge-graph not configured; call configureKnowledgeGraph() from REPI kernel init");
	}
	return knowledgeGraphDeps;
}

export function appendEvidence(...args: any[]): any {
	return deps().appendEvidence(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return deps().updateMissionCheckpoint(...args);
}

export function latestScopedMarkdownArtifact(...args: any[]): string | undefined {
	return deps().latestScopedMarkdownArtifact(...args);
}

export function autonomousExecutionBudget(...args: any[]): any {
	return deps().autonomousExecutionBudget(...args);
}

export function failureSignaturePriorityReport(...args: any[]): any {
	return deps().failureSignaturePriorityReport(...args);
}

export function latestDispatcherFeedbackBoard(...args: any[]): any {
	return deps().latestDispatcherFeedbackBoard(...args);
}

export function latestWorkerScoreboard(...args: any[]): any {
	return deps().latestWorkerScoreboard(...args);
}

export function readMemoryEvents(...args: any[]): any[] {
	return deps().readMemoryEvents(...args);
}

export function buildMemoryScopeIsolationReport(...args: any[]): any {
	return deps().buildMemoryScopeIsolationReport(...args);
}

export function knowledgeCaseMemoryCandidates(...args: any[]): any {
	return deps().knowledgeCaseMemoryCandidates(...args);
}

export function sanitizeTargetForCommand(...args: any[]): string | undefined {
	return deps().sanitizeTargetForCommand(...args);
}
