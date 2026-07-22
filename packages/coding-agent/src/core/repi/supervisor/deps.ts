/**
 * Supervisor DI deps and passthrough stubs.
 */
import type { SupervisorDeps } from "./types.ts";

export type { SupervisorDeps } from "./types.ts";

let supervisorDeps: SupervisorDeps | null = null;

export function configureSupervisor(deps: SupervisorDeps): void {
	supervisorDeps = deps;
}

export function d(): SupervisorDeps {
	if (!supervisorDeps) throw new Error("supervisor not configured; call configureSupervisor() from REPI kernel init");
	return supervisorDeps;
}

export function appendEvidence(...args: any[]): any {
	return d().appendEvidence(...args);
}

export function buildClaimCheckResult(...args: any[]): any {
	return d().buildClaimCheckResult(...args);
}

export function latestOrBuildDelegate(...args: any[]): any {
	return d().latestOrBuildDelegate(...args);
}

export function latestScopedMarkdownArtifact(...args: any[]): any {
	return d().latestScopedMarkdownArtifact(...args);
}

export function readCurrentMission(...args: any[]): any {
	return d().readCurrentMission(...args);
}

export function reviewSwarmWorkerRuntime(...args: any[]): any {
	return d().reviewSwarmWorkerRuntime(...args);
}

export function strictClaimCheckSnapshot(...args: any[]): any {
	return d().strictClaimCheckSnapshot(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}
