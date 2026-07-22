/** Delegate deps bus. */
import type { DelegateDeps } from "./types.ts";

let delegateDeps: DelegateDeps | null = null;

export function configureDelegate(deps: DelegateDeps): void {
	delegateDeps = deps;
}

export function d(): DelegateDeps {
	if (!delegateDeps) throw new Error("delegate not configured; call configureDelegate() from REPI kernel init");
	return delegateDeps;
}

export function appendEvidence(...args: any[]): any {
	return d().appendEvidence(...args);
}
export function autonomousExecutionBudget(...args: any[]): any {
	return d().autonomousExecutionBudget(...args);
}
export function dispatcherAdaptiveRoutingHints(...args: any[]): any {
	return d().dispatcherAdaptiveRoutingHints(...args);
}
export function latestScopedMarkdownArtifact(...args: any[]): any {
	return d().latestScopedMarkdownArtifact(...args);
}
export function operatorCommandConcrete(...args: any[]): any {
	return d().operatorCommandConcrete(...args);
}
export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}
export function workerAdaptiveRoutingHints(...args: any[]): any {
	return d().workerAdaptiveRoutingHints(...args);
}
