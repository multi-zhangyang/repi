/**
 * Memory events DI deps and outcome classifiers.
 * Reverse proof blockers flow into completion memory domain tags/lessons.
 */
import type { AutofixArtifact } from "./autofix.ts";
import type { MemoryOutcome } from "./lane-memory.ts";
import type { ReplayArtifact } from "./runtime-types.ts";

export type MemoryEventsDeps = {
	latestCompilerArtifactPath: (...args: any[]) => any;
	latestContextPackArtifactPath: (...args: any[]) => any;
	latestProofLoopArtifactPath: (...args: any[]) => any;
	latestSupervisorArtifactPath: (...args: any[]) => any;
};

let memoryEventsDeps: MemoryEventsDeps | null = null;

export function configureMemoryEvents(deps: MemoryEventsDeps): void {
	memoryEventsDeps = deps;
}

function d(): MemoryEventsDeps {
	if (!memoryEventsDeps)
		throw new Error("memory-events not configured; call configureMemoryEvents() from REPI kernel init");
	return memoryEventsDeps;
}

export function latestCompilerArtifactPath(...args: any[]): any {
	return d().latestCompilerArtifactPath(...args);
}
export function latestContextPackArtifactPath(...args: any[]): any {
	return d().latestContextPackArtifactPath(...args);
}
export function latestProofLoopArtifactPath(...args: any[]): any {
	return d().latestProofLoopArtifactPath(...args);
}
export function latestSupervisorArtifactPath(...args: any[]): any {
	return d().latestSupervisorArtifactPath(...args);
}

export function replayMemoryOutcome(replay: ReplayArtifact): MemoryOutcome {
	if (replay.mode !== "run") return "partial";
	if (replay.passed > 0 && replay.failed === 0 && replay.blocked.length === 0) return "success";
	if (replay.failed > 0) return "repair";
	if (replay.blocked.length > 0) return "blocked";
	return "partial";
}

export function autofixMemoryOutcome(autofix: AutofixArtifact): MemoryOutcome {
	if (autofix.mode === "apply" && autofix.applied.length > 0 && autofix.failures.length === 0) return "success";
	if (autofix.failures.length > 0 || autofix.patchQueue.length > 0 || autofix.commandSubstitutions.length > 0)
		return "repair";
	if (autofix.bootstrapQueue.length > 0 || autofix.evidenceRecaptureQueue.length > 0) return "partial";
	return autofix.mode === "apply" ? "success" : "partial";
}
