/**
 * Swarm-runtime DI deps and passthrough stubs.
 */
import type { SwarmRuntimeDeps } from "./types.ts";

export type { SwarmRuntimeDeps } from "./types.ts";

let swarmRuntimeDeps: SwarmRuntimeDeps | null = null;

export function configureSwarmRuntime(deps: SwarmRuntimeDeps): void {
	swarmRuntimeDeps = deps;
}

export function d(): SwarmRuntimeDeps {
	if (!swarmRuntimeDeps)
		throw new Error("swarm-runtime not configured; call configureSwarmRuntime() from REPI kernel init");
	return swarmRuntimeDeps;
}

export function operatorCommandConcrete(...args: any[]): any {
	return (d() as any).operatorCommandConcrete(...args);
}

export function appendEvidence(...args: any[]): any {
	return (d() as any).appendEvidence(...args);
}

export function deriveSwarmAuditFields(...args: any[]): any {
	return (d() as any).deriveSwarmAuditFields(...args);
}

export function latestOrBuildDelegate(...args: any[]): any {
	return (d() as any).latestOrBuildDelegate(...args);
}

export function latestScopedMarkdownArtifact(...args: any[]): any {
	return (d() as any).latestScopedMarkdownArtifact(...args);
}

export function refreshSwarmRunDerivedFields(...args: any[]): any {
	return (d() as any).refreshSwarmRunDerivedFields(...args);
}

export function refreshSwarmRuntimeClaimLedger(...args: any[]): any {
	return (d() as any).refreshSwarmRuntimeClaimLedger(...args);
}

export function refreshSwarmSubagentRuntimeManifestCapture(...args: any[]): any {
	return (d() as any).refreshSwarmSubagentRuntimeManifestCapture(...args);
}

export function refreshSwarmWorkerChildSessionRuntime(...args: any[]): any {
	return (d() as any).refreshSwarmWorkerChildSessionRuntime(...args);
}

export function refreshSwarmWorkerLeaseScheduler(...args: any[]): any {
	return (d() as any).refreshSwarmWorkerLeaseScheduler(...args);
}

export function refreshSwarmWorkerRetryHandoffClosure(...args: any[]): any {
	return (d() as any).refreshSwarmWorkerRetryHandoffClosure(...args);
}

export function scopedMarkdownArtifacts(...args: any[]): any {
	return (d() as any).scopedMarkdownArtifacts(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return (d() as any).updateMissionCheckpoint(...args);
}
