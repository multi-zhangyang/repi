/** Control-plane re_lane tool deps. */
export type ControlLaneGraphToolDeps = {
	activeLane: (...args: any[]) => any;
	buildAttackGraphOutput: (...args: any[]) => any;
	createMission: (...args: any[]) => any;
	currentMissionPath: (...args: any[]) => any;
	formatLaneCommandPack: (...args: any[]) => any;
	formatLaneQueue: (...args: any[]) => any;
	laneCommandPack: (...args: any[]) => any;
	latestAttackGraphArtifactPath: (...args: any[]) => any;
	readCurrentMission: (...args: any[]) => any;
	routeReconTask: (...args: any[]) => any;
	runAutoLaneChain: (...args: any[]) => any;
	runLaneCommandPack: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	updateMissionLane: (...args: any[]) => any;
	writeCurrentMission: (...args: any[]) => any;
};
