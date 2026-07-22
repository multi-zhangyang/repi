/** Auto-lane types. */
export type RunAutoDecision = {
	action: "continue_current" | "continue_next" | "stop";
	reason: string;
	nextLane?: string;
	quality?: number;
	verdict?: string;
};

export type AutoLaneDeps = {
	[key: string]: any;
	readCurrentMission: (...args: any[]) => any;
	activeLane: (...args: any[]) => any;
	laneCommandPack: (...args: any[]) => any;
	applyCaseMemoryLanePlan: (...args: any[]) => any;
	formatCaseMemoryLanePlan: (...args: any[]) => any;
	runLaneCommandPack: (...args: any[]) => any;
	runToolBootstrapClosure: (...args: any[]) => any;
	writeRunAutoPlaybook: (...args: any[]) => any;
	applyAdaptiveMultiLanePlan: (...args: any[]) => any;
	formatMultiLanePlan: (...args: any[]) => any;

	autoLaneCommandPack?: (...args: any[]) => any;
	autoCommandsForLane?: (...args: any[]) => any;
	removeLaneNextItems?: (...args: any[]) => any;
	parseLaneRunDecision?: (...args: any[]) => any;
	shouldEscalateAdaptiveDecision?: (...args: any[]) => any;
	formatRunAutoDecision?: (...args: any[]) => any;
};
