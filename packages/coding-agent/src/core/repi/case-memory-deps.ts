/** Case-memory DI + configure. */
export type CaseMemoryDeps = {
	writeCurrentMission: (...args: any[]) => any;
	upsertMissionCheckpoint: (...args: any[]) => any;
	findLaneIndex: (...args: any[]) => any;
	caseMemoryLanePlan: (...args: any[]) => any;
	memoryPath: (...args: any[]) => any;
};

let caseMemoryDeps: CaseMemoryDeps | null = null;

export function configureCaseMemory(deps: CaseMemoryDeps): void {
	caseMemoryDeps = deps;
}

export function d(): CaseMemoryDeps {
	if (!caseMemoryDeps) throw new Error("case-memory not configured; call configureCaseMemory() from REPI kernel init");
	return caseMemoryDeps;
}

export function writeCurrentMission(...args: any[]): any {
	return d().writeCurrentMission(...args);
}
export function upsertMissionCheckpoint(...args: any[]): any {
	return d().upsertMissionCheckpoint(...args);
}
export function findLaneIndex(...args: any[]): any {
	return d().findLaneIndex(...args);
}
export function caseMemoryLanePlan(...args: any[]): any {
	return d().caseMemoryLanePlan(...args);
}
export function memoryPath(...args: any[]): any {
	return d().memoryPath(...args);
}
