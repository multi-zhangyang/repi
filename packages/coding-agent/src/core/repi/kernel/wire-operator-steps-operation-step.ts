/** Wire-operator: configureOperationStep bag. */

import { buildAttackGraphOutput } from "../attack-graph.ts";
import { runAutoLaneChain } from "../auto-lane.ts";
import { buildAutofixOutput } from "../autofix.ts";
import { buildCampaignOutput } from "../campaign-runtime.ts";
import { buildCompilerOutput } from "../compiler-runtime.ts";
import { formatCompletionAudit, writeReportScaffold } from "../completion-audit.ts";
import { buildDecisionCoreOutput, runDecisionCore } from "../decision-runtime.ts";
import { buildExploitChainOutput } from "../exploit-chain.ts";
import { buildKernelOutput } from "../kernel-runtime.ts";
import { buildKnowledgeGraphOutput } from "../knowledge-graph.ts";
import { formatLaneCommandPack, laneCommandPack, runLaneCommandPack } from "../lane-commands.ts";
import {
	activeLane,
	createMission,
	readCurrentMission,
	updateMissionCheckpoint,
	writeCurrentMission,
} from "../mission.ts";
import { configureOperationStep } from "../operation-step.ts";
import { runPassiveMap } from "../passive-map.ts";
import { buildProofLoopOutput, runProofLoop } from "../proof-loop-runtime.ts";
import { buildReplayerOutput, runReplayer } from "../replayer-runtime.ts";
import {
	buildExploitLabOutput,
	buildLiveBrowserOutput,
	buildMobileRuntimeOutput,
	buildNativeRuntimeOutput,
	buildWebAuthzStateOutput,
	runExploitLab,
	runLiveBrowser,
	runMobileRuntime,
	runNativeRuntime,
	runWebAuthzState,
} from "../reverse-io.ts";
import { routeReconTask } from "../routes.ts";
import { createBootstrapPlan, formatBootstrapPlan, refreshToolIndex } from "../tool-index.ts";
import { buildVerifierOutput } from "../verifier-runtime.ts";
import type { PickFn } from "./wire-pick.ts";
export function wireOperatorStepOperationModules(pick: PickFn): void {
	configureOperationStep({
		runDecisionCore: pick("runDecisionCore", runDecisionCore),
		buildDecisionCoreOutput: pick("buildDecisionCoreOutput", buildDecisionCoreOutput),
		runAutoLaneChain: pick("runAutoLaneChain", runAutoLaneChain),
		readCurrentMission: pick("readCurrentMission", readCurrentMission),
		writeCurrentMission: pick("writeCurrentMission", writeCurrentMission),
		createMission: pick("createMission", createMission),
		routeReconTask: pick("routeReconTask", routeReconTask),
		activeLane: pick("activeLane", activeLane),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		laneCommandPack: pick("laneCommandPack", laneCommandPack),
		formatLaneCommandPack: pick("formatLaneCommandPack", formatLaneCommandPack),
		runLaneCommandPack: pick("runLaneCommandPack", runLaneCommandPack),
		runPassiveMap: pick("runPassiveMap", runPassiveMap),
		buildKernelOutput: pick("buildKernelOutput", buildKernelOutput),
		runLiveBrowser: pick("runLiveBrowser", runLiveBrowser),
		buildLiveBrowserOutput: pick("buildLiveBrowserOutput", buildLiveBrowserOutput),
		runWebAuthzState: pick("runWebAuthzState", runWebAuthzState),
		buildWebAuthzStateOutput: pick("buildWebAuthzStateOutput", buildWebAuthzStateOutput),
		runMobileRuntime: pick("runMobileRuntime", runMobileRuntime),
		buildMobileRuntimeOutput: pick("buildMobileRuntimeOutput", buildMobileRuntimeOutput),
		runNativeRuntime: pick("runNativeRuntime", runNativeRuntime),
		buildNativeRuntimeOutput: pick("buildNativeRuntimeOutput", buildNativeRuntimeOutput),
		runExploitLab: pick("runExploitLab", runExploitLab),
		buildExploitLabOutput: pick("buildExploitLabOutput", buildExploitLabOutput),
		buildAttackGraphOutput: pick("buildAttackGraphOutput", buildAttackGraphOutput),
		buildExploitChainOutput: pick("buildExploitChainOutput", buildExploitChainOutput),
		buildCampaignOutput: pick("buildCampaignOutput", buildCampaignOutput),
		runReplayer: pick("runReplayer", runReplayer),
		buildReplayerOutput: pick("buildReplayerOutput", buildReplayerOutput),
		buildAutofixOutput: pick("buildAutofixOutput", buildAutofixOutput),
		runProofLoop: pick("runProofLoop", runProofLoop),
		buildProofLoopOutput: pick("buildProofLoopOutput", buildProofLoopOutput),
		buildKnowledgeGraphOutput: pick("buildKnowledgeGraphOutput", buildKnowledgeGraphOutput),
		buildVerifierOutput: pick("buildVerifierOutput", buildVerifierOutput),
		buildCompilerOutput: pick("buildCompilerOutput", buildCompilerOutput),
		createBootstrapPlan: pick("createBootstrapPlan", createBootstrapPlan),
		formatBootstrapPlan: pick("formatBootstrapPlan", formatBootstrapPlan),
		formatCompletionAudit: pick("formatCompletionAudit", formatCompletionAudit),
		writeReportScaffold: pick("writeReportScaffold", writeReportScaffold),
		refreshToolIndex: pick("refreshToolIndex", refreshToolIndex),
	});
}
