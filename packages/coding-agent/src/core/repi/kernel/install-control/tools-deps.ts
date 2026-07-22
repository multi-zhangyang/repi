/** Control-plane tool DI deps. */
import type { ExtensionAPI } from "../../../extensions/types.ts";

export type ControlPlaneToolDeps = {
	routeReconTask: (task: string) => any;
	techniqueIdsForRoute: (route: any) => string[];
	formatRoute: (route: any) => string;
	buildKernelOutput: (...args: any[]) => string;
	latestKernelArtifactPath: () => string | undefined;
	buildDecisionCoreOutput: (...args: any[]) => string;
	latestDecisionCoreArtifactPath: () => string | undefined;
	runDecisionCore: (...args: any[]) => any;
	buildMissionDigest: (...args: any[]) => string;
	createMission: (...args: any[]) => any;
	currentMissionPath: (...args: any[]) => string;
	formatMission: (...args: any[]) => string;
	updateMissionCheckpoint: (...args: any[]) => any;
	writeCurrentMission: (...args: any[]) => any;
	activeLane: (...args: any[]) => any;
	formatLaneCommandPack: (...args: any[]) => string;
	formatLaneQueue: (...args: any[]) => string;
	laneCommandPack: (...args: any[]) => any;
	readCurrentMission: () => any;
	runAutoLaneChain: (...args: any[]) => any;
	runLaneCommandPack: (...args: any[]) => any;
	updateMissionLane: (...args: any[]) => any;
	runPassiveMap: (...args: any[]) => any;
	evidenceMapsDir: (...args: any[]) => string;
	appendEvidence: (...args: any[]) => any;
	buildEvidenceDigest: (...args: any[]) => string;
	evidenceLedgerPath: (...args: any[]) => string;
	buildAttackGraphOutput: (...args: any[]) => string;
	latestAttackGraphArtifactPath: () => string | undefined;
	buildOperatorOutput: (...args: any[]) => any;
	dispatchOperatorQueue: (...args: any[]) => any;
	latestOperatorArtifactPath: (...args: any[]) => any;
	buildReLaneSpecialistCommandPackGate: (...args: any[]) => any;
	formatReLaneSpecialistCommandPackGate: (...args: any[]) => any;
	sendDisplayMessage: (pi: ExtensionAPI, title: string, text: string) => void;
	truncateMiddle: (...args: any[]) => any;
	/** Claude Code-style dynamic tool activation after route. */
	activateToolsForRoute?: (domain: string) => string[];
};
