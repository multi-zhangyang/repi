import type { ArtifactScopeFilterOptions } from "../artifact-scope.ts";
import { evidenceReflectionsDir, readTextFile as readText } from "../storage.ts";

export type ReflectionArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "write";
	supervisorArtifact?: string;
	lessons: string[];
	failurePatterns: string[];
	reuseRules: string[];
	repairPlaybook: string[];
	journalAnchor?: string;
	evolutionAnchor?: string;
	playbookPath?: string;
	nextActions: string[];
	sourceArtifacts: string[];
};

export type ReflectionDeps = {
	appendEvidence: (...args: any[]) => any;
	buildWorkerPromotionQueue: (...args: any[]) => any;
	latestOrBuildSupervisor: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	workerAdaptiveRoutingHints: (...args: any[]) => any;
	writeReflectionMemory: (...args: any[]) => any;
};

let reflectionDeps: ReflectionDeps | null = null;

export function configureReflection(deps: ReflectionDeps): void {
	reflectionDeps = deps;
}

function d(): ReflectionDeps {
	if (!reflectionDeps) throw new Error("reflection not configured; call configureReflection() from REPI kernel init");
	return reflectionDeps;
}

export function appendEvidence(...args: any[]): any {
	return d().appendEvidence(...args);
}
export function buildWorkerPromotionQueue(...args: any[]): any {
	return d().buildWorkerPromotionQueue(...args);
}
export function latestOrBuildSupervisor(...args: any[]): any {
	return d().latestOrBuildSupervisor(...args);
}
export function latestScopedMarkdownArtifact(...args: any[]): any {
	return d().latestScopedMarkdownArtifact(...args);
}
export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}
export function workerAdaptiveRoutingHints(...args: any[]): any {
	return d().workerAdaptiveRoutingHints(...args);
}
export function writeReflectionMemory(...args: any[]): any {
	return d().writeReflectionMemory(...args);
}

export function latestReflectionArtifactPath(options: ArtifactScopeFilterOptions = {}): string | undefined {
	return latestScopedMarkdownArtifact("reflection", evidenceReflectionsDir(), options);
}

export function parseReflectionArtifact(path: string): ReflectionArtifact | undefined {
	const match = /```json\s*([\s\S]*?)\s*```/m.exec(readText(path));
	if (!match?.[1]) return undefined;
	try {
		return JSON.parse(match[1]) as ReflectionArtifact;
	} catch {
		return undefined;
	}
}
