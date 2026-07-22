/** Autopilot DI deps. */
export type AutopilotDeps = {
	updateMissionCheckpoint: (...args: any[]) => any;
	uniqueMatches: (...args: any[]) => any;
	formatMission: (...args: any[]) => any;
	appendJournal: (...args: any[]) => any;
	appendEvolution: (...args: any[]) => any;
	createBootstrapPlan: (...args: any[]) => any;
	fallbackForMissingTools: (...args: any[]) => any;
	formatBootstrapPlan: (...args: any[]) => any;
	missingToolsForCommand: (...args: any[]) => any;
	parseToolIndex: (...args: any[]) => any;
	recommendedToolsForRoute: (...args: any[]) => any;
};

let autopilotDeps: AutopilotDeps | null = null;

export function configureAutopilot(deps: AutopilotDeps): void {
	autopilotDeps = deps;
}

export function d(): AutopilotDeps {
	if (!autopilotDeps) throw new Error("autopilot not configured; call configureAutopilot() from REPI kernel init");
	return autopilotDeps;
}

export function updateMissionCheckpoint(...args: any[]): any {
	return d().updateMissionCheckpoint(...args);
}
export function uniqueMatches(...args: any[]): any {
	return d().uniqueMatches(...args);
}
export function formatMission(...args: any[]): any {
	return d().formatMission(...args);
}
export function appendJournal(...args: any[]): any {
	return d().appendJournal(...args);
}
export function appendEvolution(...args: any[]): any {
	return d().appendEvolution(...args);
}
export function createBootstrapPlan(...args: any[]): any {
	return d().createBootstrapPlan(...args);
}
export function fallbackForMissingTools(...args: any[]): any {
	return d().fallbackForMissingTools(...args);
}
export function formatBootstrapPlan(...args: any[]): any {
	return d().formatBootstrapPlan(...args);
}
export function missingToolsForCommand(...args: any[]): any {
	return d().missingToolsForCommand(...args);
}
export function parseToolIndex(...args: any[]): any {
	return d().parseToolIndex(...args);
}
export function recommendedToolsForRoute(...args: any[]): any {
	return d().recommendedToolsForRoute(...args);
}
