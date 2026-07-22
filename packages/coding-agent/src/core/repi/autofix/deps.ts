/** Autofix deps bus. */
import type { AutofixDeps } from "./types.ts";

let autofixDeps: AutofixDeps | null = null;

export function configureAutofix(deps: AutofixDeps): void {
	autofixDeps = deps;
}

export function d(): AutofixDeps {
	if (!autofixDeps) throw new Error("autofix not configured; call configureAutofix()");
	return autofixDeps;
}

export function latestCompilerArtifactPath(...args: any[]): any {
	return (d() as any).latestCompilerArtifactPath(...args);
}
export function parseCompilerArtifact(...args: any[]): any {
	return (d() as any).parseCompilerArtifact(...args);
}
export function operatorFeedbackNextCommands(...args: any[]): any {
	return (d() as any).operatorFeedbackNextCommands(...args);
}
export function appendJournal(...args: any[]): any {
	return (d() as any).appendJournal(...args);
}
export function updateMissionCheckpoint(...args: any[]): any {
	return (d() as any).updateMissionCheckpoint(...args);
}
export function appendEvidence(...args: any[]): any {
	return (d() as any).appendEvidence(...args);
}
export function appendAutofixMemoryEvent(...args: any[]): any {
	return (d() as any).appendAutofixMemoryEvent(...args);
}
export function appendRuntimeFailureRepairFromAutofix(...args: any[]): any {
	return (d() as any).appendRuntimeFailureRepairFromAutofix(...args);
}
export function latestScopedMarkdownArtifact(...args: any[]): any {
	return (d() as any).latestScopedMarkdownArtifact(...args);
}
