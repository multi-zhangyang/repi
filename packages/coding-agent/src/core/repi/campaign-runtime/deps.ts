/** Campaign-runtime deps bus. */
import type { CampaignRuntimeDeps } from "./types.ts";

let campaignRuntimeDeps: CampaignRuntimeDeps | null = null;

export function configureCampaignRuntime(deps: CampaignRuntimeDeps): void {
	campaignRuntimeDeps = deps;
}

export function d(): CampaignRuntimeDeps {
	if (!campaignRuntimeDeps)
		throw new Error("campaign-runtime not configured; call configureCampaignRuntime() from REPI kernel init");
	return campaignRuntimeDeps;
}

export function appendEvidence(...args: any[]): any {
	return (d() as any).appendEvidence(...args);
}
export function buildAttackGraph(...args: any[]): any {
	return (d() as any).buildAttackGraph(...args);
}
export function createBootstrapPlan(...args: any[]): any {
	return (d() as any).createBootstrapPlan(...args);
}
export function inferTargetFromMap(...args: any[]): any {
	return (d() as any).inferTargetFromMap(...args);
}
export function latestPassiveMapContext(...args: any[]): any {
	return (d() as any).latestPassiveMapContext(...args);
}
export function latestScopedMarkdownArtifact(...args: any[]): any {
	return (d() as any).latestScopedMarkdownArtifact(...args);
}
export function recommendedToolsForRoute(...args: any[]): any {
	return (d() as any).recommendedToolsForRoute(...args);
}
export function routeReconTask(...args: any[]): any {
	return (d() as any).routeReconTask(...args);
}
export function updateMissionCheckpoint(...args: any[]): any {
	return (d() as any).updateMissionCheckpoint(...args);
}
export function writeAttackGraphArtifact(...args: any[]): any {
	return (d() as any).writeAttackGraphArtifact(...args);
}
export function readCurrentMission(...args: any[]): any {
	return (d() as any).readCurrentMission(...args);
}
export function writeCurrentMission(...args: any[]): any {
	return (d() as any).writeCurrentMission(...args);
}
export function createMission(...args: any[]): any {
	return (d() as any).createMission(...args);
}
