/**
 * Operator-runtime DI deps and passthrough stubs.
 */
import type { OperatorRuntimeDeps } from "./deps-types.ts";

export type { OperatorRuntimeDeps } from "./deps-types.ts";

let operatorRuntimeDeps: OperatorRuntimeDeps | null = null;

export function configureOperatorRuntime(deps: OperatorRuntimeDeps): void {
	operatorRuntimeDeps = deps;
}

export function d(): OperatorRuntimeDeps {
	if (!operatorRuntimeDeps)
		throw new Error("operator-runtime not configured; call configureOperatorRuntime() from REPI kernel init");
	return operatorRuntimeDeps;
}

export function latestReplayerArtifactPath(...args: any[]): any {
	const fn = (d() as any).latestReplayerArtifactPath;
	if (typeof fn === "function") return fn(...args);
	return undefined;
}

export function writeDispatcherPromotionPlaybook(...args: any[]): any {
	return (d() as any).writeDispatcherPromotionPlaybook(...args);
}

export function addStep(...args: any[]): any {
	return (d() as any).addStep(...args);
}

export function appendEvidence(...args: any[]): any {
	return (d() as any).appendEvidence(...args);
}

export function appendRuntimeFailureRepairFromOperator(...args: any[]): any {
	return (d() as any).appendRuntimeFailureRepairFromOperator(...args);
}

export function artifactTargetMatches(...args: any[]): any {
	return (d() as any).artifactTargetMatches(...args);
}

export function autonomousLaneDemotionRows(...args: any[]): any {
	return (d() as any).autonomousLaneDemotionRows(...args);
}

export function caseMemoryLanePlanLines(...args: any[]): any {
	return (d() as any).caseMemoryLanePlanLines(...args);
}

export function commandTargetSuffix(...args: any[]): any {
	return (d() as any).commandTargetSuffix(...args);
}

export function compactionResumeTelemetryPath(...args: any[]): any {
	return (d() as any).compactionResumeTelemetryPath(...args);
}

export function cumulativeDispatcherScoreDecayRows(...args: any[]): any {
	return (d() as any).cumulativeDispatcherScoreDecayRows(...args);
}

export function dispatcherScoreDecayRows(...args: any[]): any {
	return (d() as any).dispatcherScoreDecayRows(...args);
}

export function executeOperatorStep(...args: any[]): any {
	return (d() as any).executeOperatorStep(...args);
}

export function formatReconCompactionResumeTelemetry(...args: any[]): any {
	return (d() as any).formatReconCompactionResumeTelemetry(...args);
}

export function highScorePromotionRows(...args: any[]): any {
	return (d() as any).highScorePromotionRows(...args);
}

export function latestAutonomousBudgetLedger(...args: any[]): any {
	return (d() as any).latestAutonomousBudgetLedger(...args);
}

export function latestOrBuildContextPack(...args: any[]): any {
	return (d() as any).latestOrBuildContextPack(...args);
}

export function latestReconCompactionResumeTelemetry(...args: any[]): any {
	return (d() as any).latestReconCompactionResumeTelemetry(...args);
}

export function latestScopedMarkdownArtifact(...args: any[]): any {
	return (d() as any).latestScopedMarkdownArtifact(...args);
}

export function latestSwarmRetryQueue(...args: any[]): any {
	return (d() as any).latestSwarmRetryQueue(...args);
}

export function repeatedFailureDemotionRows(...args: any[]): any {
	return (d() as any).repeatedFailureDemotionRows(...args);
}

export function updateMissionCheckpoint(...args: any[]): any {
	return (d() as any).updateMissionCheckpoint(...args);
}

export function updateReconCompactionTelemetryFromOperator(...args: any[]): any {
	return (d() as any).updateReconCompactionTelemetryFromOperator(...args);
}

export function workerScoreDemotionRows(...args: any[]): any {
	return (d() as any).workerScoreDemotionRows(...args);
}
