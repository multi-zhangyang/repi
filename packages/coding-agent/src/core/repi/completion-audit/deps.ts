/** Completion-audit DI deps. */
export type CompletionAuditDeps = {
	[key: string]: any;
	appendEvidence?: (...args: any[]) => any;
	appendCompletionMemoryEvent: (...args: any[]) => any;
	buildEvidenceDigest: (...args: any[]) => any;
	formatMission: (...args: any[]) => any;
	latestCompilerArtifactPath: (...args: any[]) => any;
	latestContextPackArtifactPath: (...args: any[]) => any;
	latestReconCompactionResumeTelemetry: (...args: any[]) => any;
	latestSupervisorArtifactPath: (...args: any[]) => any;
	latestSwarmArtifactPath: (...args: any[]) => any;
	parseCompilerArtifact: (...args: any[]) => any;
	parseContextPackArtifact: (...args: any[]) => any;
	parseSupervisorArtifact: (...args: any[]) => any;
	parseSwarmArtifact: (...args: any[]) => any;
	readCurrentMission: (...args: any[]) => any;
	strictClaimCheckSnapshot: (...args: any[]) => any;
	structuredClaimMergeCheckFromSwarm: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	verifyCompactionResumeLedger: (...args: any[]) => any;
	verifyContextPackResume: (...args: any[]) => any;

	formatDomainProofExitClosure?: (...args: any[]) => any;
};

let completionAuditDeps: CompletionAuditDeps | null = null;

export function configureCompletionAudit(deps: CompletionAuditDeps): void {
	completionAuditDeps = deps;
}

function d(): CompletionAuditDeps {
	if (!completionAuditDeps)
		throw new Error("completion-audit not configured; call configureCompletionAudit() from REPI kernel init");
	return completionAuditDeps;
}

function appendCompletionMemoryEvent(...args: any[]): any {
	return (d() as any).appendCompletionMemoryEvent(...args);
}
export function buildEvidenceDigest(...args: any[]): any {
	return (d() as any).buildEvidenceDigest(...args);
}
export function formatMission(...args: any[]): any {
	return (d() as any).formatMission(...args);
}
function latestCompilerArtifactPath(...args: any[]): any {
	return (d() as any).latestCompilerArtifactPath(...args);
}
function latestContextPackArtifactPath(...args: any[]): any {
	return (d() as any).latestContextPackArtifactPath(...args);
}
function latestReconCompactionResumeTelemetry(...args: any[]): any {
	return (d() as any).latestReconCompactionResumeTelemetry(...args);
}
function latestSupervisorArtifactPath(...args: any[]): any {
	return (d() as any).latestSupervisorArtifactPath(...args);
}
function latestSwarmArtifactPath(...args: any[]): any {
	return (d() as any).latestSwarmArtifactPath(...args);
}
function parseCompilerArtifact(...args: any[]): any {
	return (d() as any).parseCompilerArtifact(...args);
}
function parseContextPackArtifact(...args: any[]): any {
	return (d() as any).parseContextPackArtifact(...args);
}
function parseSupervisorArtifact(...args: any[]): any {
	return (d() as any).parseSupervisorArtifact(...args);
}
function parseSwarmArtifact(...args: any[]): any {
	return (d() as any).parseSwarmArtifact(...args);
}
function readCurrentMission(...args: any[]): any {
	return (d() as any).readCurrentMission(...args);
}
function strictClaimCheckSnapshot(...args: any[]): any {
	return (d() as any).strictClaimCheckSnapshot(...args);
}
function structuredClaimMergeCheckFromSwarm(...args: any[]): any {
	return (d() as any).structuredClaimMergeCheckFromSwarm(...args);
}
function updateMissionCheckpoint(...args: any[]): any {
	return (d() as any).updateMissionCheckpoint(...args);
}
function verifyCompactionResumeLedger(...args: any[]): any {
	return (d() as any).verifyCompactionResumeLedger(...args);
}
function verifyContextPackResume(...args: any[]): any {
	return (d() as any).verifyContextPackResume(...args);
}
function appendEvidence(...args: any[]): any {
	return (d() as any).appendEvidence(...args);
}

export {
	appendEvidence,
	appendCompletionMemoryEvent,
	latestCompilerArtifactPath,
	latestContextPackArtifactPath,
	latestReconCompactionResumeTelemetry,
	latestSupervisorArtifactPath,
	latestSwarmArtifactPath,
	parseCompilerArtifact,
	parseContextPackArtifact,
	parseSupervisorArtifact,
	parseSwarmArtifact,
	readCurrentMission,
	strictClaimCheckSnapshot,
	structuredClaimMergeCheckFromSwarm,
	updateMissionCheckpoint,
	verifyCompactionResumeLedger,
	verifyContextPackResume,
};
