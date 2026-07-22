export type MultiLanePlan = any;

export type LaneRunMissionDeps = {
	writeCurrentMission: (...args: any[]) => any;
	toolIndexPath: (...args: any[]) => any;
	metadataValue: (...args: any[]) => any;
};

let laneRunMissionDeps: LaneRunMissionDeps | null = null;

export function configureLaneRunMission(deps: LaneRunMissionDeps): void {
	laneRunMissionDeps = deps;
}

export function metadataValue(...args: any[]): any {
	return d().metadataValue(...args);
}

export function toolIndexPath(...args: any[]): any {
	return d().toolIndexPath(...args);
}

function d(): LaneRunMissionDeps {
	if (!laneRunMissionDeps)
		throw new Error("lane-run-mission not configured; call configureLaneRunMission() from REPI kernel init");
	return laneRunMissionDeps;
}

export function writeCurrentMission(...args: any[]): any {
	return d().writeCurrentMission(...args);
}
