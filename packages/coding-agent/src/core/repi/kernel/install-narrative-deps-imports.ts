/** Narrative install deps import bag (full surface only). */

import { createAgentThreadManager } from "../../agent-thread-manager.ts";
import { runAutopilot } from "../autopilot.ts";
import {
	buildCampaignOutput,
	buildOperationOutput,
	latestCampaignArtifactPath,
	latestOperationArtifactPath,
} from "../campaign-runtime.ts";
import { buildContextOutput, latestContextPackArtifactPath } from "../context-pack.ts";
import { buildDecisionCoreOutput, latestDecisionCoreArtifactPath, runDecisionCore } from "../decision-runtime.ts";
import { buildDelegateOutput, latestDelegateArtifactPath } from "../delegate.ts";
import { buildExploitChainOutput, latestExploitChainArtifactPath } from "../exploit-chain.ts";
import { buildKernelOutput, latestKernelArtifactPath } from "../kernel-runtime.ts";
import { buildKnowledgeGraphOutput, latestKnowledgeGraphArtifactPath } from "../knowledge-graph.ts";
import { deleteNote, listNotes, readNote, writeNote } from "../memory-stubs.ts";
import { runOperationQueue } from "../operation-step.ts";
import { buildOperatorOutput, dispatchOperatorQueue, latestOperatorArtifactPath } from "../operator-runtime.ts";
import { buildPentestingTaskTreeSnapshot } from "../pentesting-task-tree.ts";
import { buildReflectOutput, latestReflectionArtifactPath } from "../reflection.ts";
import { buildSupervisorOutput, latestSupervisorArtifactPath } from "../supervisor.ts";
import { runSwarm } from "../swarm-exec.ts";
import { buildSwarmOutput, latestSwarmArtifactPath } from "../swarm-runtime.ts";
import { makeSelfReview } from "./session-helpers.ts";

export const narrativeInstallDepsBag = {
	buildCampaignOutput,
	buildOperationOutput,
	latestCampaignArtifactPath,
	latestOperationArtifactPath,
	buildContextOutput,
	latestContextPackArtifactPath,
	buildDecisionCoreOutput,
	latestDecisionCoreArtifactPath,
	runDecisionCore,
	buildDelegateOutput,
	latestDelegateArtifactPath,
	buildExploitChainOutput,
	latestExploitChainArtifactPath,
	buildKernelOutput,
	latestKernelArtifactPath,
	buildKnowledgeGraphOutput,
	latestKnowledgeGraphArtifactPath,
	buildOperatorOutput,
	dispatchOperatorQueue,
	latestOperatorArtifactPath,
	buildPentestingTaskTreeSnapshot,
	buildReflectOutput,
	latestReflectionArtifactPath,
	buildSupervisorOutput,
	latestSupervisorArtifactPath,
	buildSwarmOutput,
	latestSwarmArtifactPath,
	createAgentThreadManager,
	deleteNote,
	listNotes,
	readNote,
	writeNote,
	makeSelfReview,
	runAutopilot,
	runOperationQueue,
	runSwarm,
} as const;
