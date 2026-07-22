/**
 * Compact-resume DI deps and passthrough stubs.
 */
import type { CompactResumeDeps } from "./types.ts";

export type { CompactResumeDeps } from "./types.ts";

let compactResumeDeps: CompactResumeDeps | null = null;

export function configureCompactResume(deps: CompactResumeDeps): void {
	compactResumeDeps = deps;
}

export function d(): CompactResumeDeps {
	if (!compactResumeDeps)
		throw new Error("compact-resume not configured; call configureCompactResume() from REPI kernel init");
	return compactResumeDeps;
}

export function appendCompactResumeTransition(...args: any[]): any {
	return (d() as any).appendCompactResumeTransition(...args);
}

export function buildCompactResumeLedgerV2Report(...args: any[]): any {
	return (d() as any).buildCompactResumeLedgerV2Report(...args);
}

export function caseMemoryLanePlanLines(...args: any[]): any {
	return (d() as any).caseMemoryLanePlanLines(...args);
}

export function compactResumeAttemptForKey(...args: any[]): any {
	return (d() as any).compactResumeAttemptForKey(...args);
}

export function compactionResumeTelemetryPath(...args: any[]): any {
	return (d() as any).compactionResumeTelemetryPath(...args);
}

export function contextBranchId(...args: any[]): any {
	return (d() as any).contextBranchId(...args);
}

export function contextPackSha256(...args: any[]): any {
	return (d() as any).contextPackSha256(...args);
}

export function hashFileSha256(...args: any[]): any {
	return (d() as any).hashFileSha256(...args);
}

export function interestingLines(...args: any[]): any {
	return (d() as any).interestingLines(...args);
}

export function normalizeReconCommand(...args: any[]): any {
	return (d() as any).normalizeReconCommand(...args);
}

export function readCompactResumeTransitions(...args: any[]): any {
	return (d() as any).readCompactResumeTransitions(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return (d() as any).updateMissionCheckpoint(...args);
}
export function readCurrentMission(...args: any[]): any {
	return (d() as any).readCurrentMission(...args);
}
