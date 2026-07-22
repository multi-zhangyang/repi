import type { MissionLane, MissionState } from "../mission/types.ts";
import type { PassiveMapContext } from "../passive-map-runtime.ts";

/** Lane-commands types. */
export type LaneCommand = {
	label: string;
	command: string;
	evidence: string;
};

export type LaneCommandPack = {
	missionId?: string;
	lane: string;
	route: string;
	target?: string;
	commands: LaneCommand[];
	notes: string[];
	caseMemoryMigrations: string[];
};

export type LaneCommandDeps = {
	latestPassiveMapContext: () => PassiveMapContext | undefined;
	inferTargetFromMap: (map: PassiveMapContext, mission: MissionState) => string | undefined;
	memoryCommandCandidates: (
		mission: MissionState,
		lane: MissionLane,
		target?: string,
	) => Array<{ label: string; command: string; evidence: string }>;
	laneExecutionStrategy: (...args: any[]) => any;
	formatAutopilotExecutionStrategy: (...args: any[]) => any;
	analyzeLaneRun: (...args: any[]) => any;
	formatLaneRunAnalysis: (...args: any[]) => any;
	appendEvidence: (...args: any[]) => any;
	appendLaneRunMemoryEvent: (...args: any[]) => any;
	appendMemoryReuseFeedback: (...args: any[]) => any;
	applyLaneRunMissionUpdate: (...args: any[]) => any;
};
