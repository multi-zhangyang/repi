/** Autonomous-budget deps bus. */

import type { AutonomousBudgetDeps } from "./types.ts";

let autonomousBudgetDeps: AutonomousBudgetDeps | null = null;

export function configureAutonomousBudget(deps: AutonomousBudgetDeps): void {
	autonomousBudgetDeps = deps;
}

export function d(): AutonomousBudgetDeps {
	if (!autonomousBudgetDeps)
		throw new Error("autonomous-budget not configured; call configureAutonomousBudget() from REPI kernel init");
	return autonomousBudgetDeps;
}

export function activeLane(...args: any[]): any {
	return d().activeLane(...args);
}
export function appendEvolution(...args: any[]): any {
	return d().appendEvolution(...args);
}
export function appendJournal(...args: any[]): any {
	return d().appendJournal(...args);
}
export function autonomousBudgetLines(...args: any[]): any {
	return d().autonomousBudgetLines(...args);
}
export function autonomousExecutionBudget(...args: any[]): any {
	return d().autonomousExecutionBudget(...args);
}
export function buildWorkerPromotionQueue(...args: any[]): any {
	return d().buildWorkerPromotionQueue(...args);
}
export function commandTargetSuffix(...args: any[]): any {
	return d().commandTargetSuffix(...args);
}
export function dispatcherFeedbackParsedRows(...args: any[]): any {
	return d().dispatcherFeedbackParsedRows(...args);
}
export function latestWorkerScoreboard(...args: any[]): any {
	return d().latestWorkerScoreboard(...args);
}
export function maintainPlaybooks(...args: any[]): any {
	return d().maintainPlaybooks(...args);
}
export function readCurrentMission(...args: any[]): any {
	return d().readCurrentMission(...args);
}
export function shellQuote(...args: any[]): any {
	return d().shellQuote(...args);
}
export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}
export function writeCurrentMission(...args: any[]): any {
	return d().writeCurrentMission(...args);
}

export function getAutonomousBudgetDeps(): AutonomousBudgetDeps {
	if (!autonomousBudgetDeps) {
		throw new Error("AutonomousBudgetDeps not configured; call configureAutonomousBudget() first");
	}
	return autonomousBudgetDeps;
}
