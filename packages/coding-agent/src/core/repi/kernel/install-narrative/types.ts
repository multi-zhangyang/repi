/** Shared types for narrative install surface. */
import type { ExtensionAPI } from "../../../extensions/types.ts";

export type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;
export type CommandRegistrar = (name: string, command: any) => void;

export type NarrativeToolDeps = {
	readCurrentMission?: (...args: any[]) => any;
	buildCampaignOutput: (...args: any[]) => any;
	buildContextOutput: (...args: any[]) => any;
	buildDelegateOutput: (...args: any[]) => any;
	buildExploitChainOutput: (...args: any[]) => any;
	buildKnowledgeGraphOutput: (...args: any[]) => any;
	buildOperationOutput: (...args: any[]) => any;
	buildOperatorOutput: (...args: any[]) => any;
	buildPentestingTaskTreeSnapshot: (...args: any[]) => any;
	buildReLaneSpecialistCommandPackGate: (...args: any[]) => any;
	buildReflectOutput: (...args: any[]) => any;
	buildSupervisorOutput: (...args: any[]) => any;
	buildSwarmOutput: (...args: any[]) => any;
	createAgentThreadManager: (...args: any[]) => any;
	currentMissionPath: (...args: any[]) => any;
	deleteNote: (...args: any[]) => any;
	dispatchOperatorQueue: (...args: any[]) => any;
	formatReLaneSpecialistCommandPackGate: (...args: any[]) => any;
	latestCampaignArtifactPath: (...args: any[]) => any;
	latestContextPackArtifactPath: (...args: any[]) => any;
	latestDelegateArtifactPath: (...args: any[]) => any;
	latestExploitChainArtifactPath: (...args: any[]) => any;
	latestKnowledgeGraphArtifactPath: (...args: any[]) => any;
	latestOperationArtifactPath: (...args: any[]) => any;
	latestOperatorArtifactPath: (...args: any[]) => any;
	latestReflectionArtifactPath: (...args: any[]) => any;
	latestSupervisorArtifactPath: (...args: any[]) => any;
	latestSwarmArtifactPath: (...args: any[]) => any;
	listNotes: (...args: any[]) => any;
	makeSelfReview: (...args: any[]) => any;
	readNote: (...args: any[]) => any;
	runAutopilot: (...args: any[]) => any;
	runOperationQueue: (...args: any[]) => any;
	runSwarm: (...args: any[]) => any;
	sendDisplayMessage: (...args: any[]) => any;
	truncateMiddle: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	writeNote: (...args: any[]) => any;
};
