import type { ExtensionAPI } from "../../../extensions/types.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

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

import { registerRepiControlGraphTools } from "./tools-lane-graph-graph.ts";
import { registerRepiControlLaneTools } from "./tools-lane-graph-lane.ts";

export function registerRepiControlLaneGraphTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ControlLaneGraphToolDeps,
): void {
	registerRepiControlLaneTools(registerTool, pi, deps);
	registerRepiControlGraphTools(registerTool, pi, deps);
}
