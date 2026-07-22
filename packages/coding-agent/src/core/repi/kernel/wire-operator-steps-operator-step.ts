/** Wire-operator: configureOperatorStep bag. */

import { buildAutofixOutput } from "../autofix.ts";
import { runAutopilot } from "../autopilot.ts";
import { buildOperationOutput } from "../campaign-runtime.ts";
import { buildCompilerOutput } from "../compiler-runtime.ts";
import { buildContextOutput } from "../context-pack.ts";
import { buildDelegateOutput } from "../delegate.ts";
import { buildKernelOutput } from "../kernel-runtime.ts";
import { buildKnowledgeGraphOutput } from "../knowledge-graph.ts";
import { formatPlaybookMaintenance } from "../memory-stubs.ts";
import {
	buildMissionDigest,
	createMission,
	formatMission,
	updateMissionCheckpoint,
	writeCurrentMission,
} from "../mission.ts";
import { executeOperationStep, operationStepFromOperator, runOperationQueue } from "../operation-step.ts";
import { buildOperatorOutput, dispatchOperatorQueue } from "../operator-runtime.ts";
import { configureOperatorStep } from "../operator-step.ts";
import { maintainPlaybooks } from "../playbooks.ts";
import { buildProofLoopOutput, runProofLoop } from "../proof-loop-runtime.ts";
import { buildReflectOutput } from "../reflection.ts";
import { buildReplayerOutput, runReplayer } from "../replayer-runtime.ts";
import {
	buildExploitLabOutput,
	buildMobileRuntimeOutput,
	buildNativeRuntimeOutput,
	buildWebAuthzStateOutput,
	runExploitLab,
	runMobileRuntime,
	runNativeRuntime,
	runWebAuthzState,
} from "../reverse-io.ts";
import { routeReconTask } from "../routes.ts";
import { buildSupervisorOutput } from "../supervisor.ts";
import { runSwarm } from "../swarm-exec.ts";
import { buildSwarmOutput } from "../swarm-runtime.ts";
import { buildVerifierOutput } from "../verifier-runtime.ts";
import type { PickFn } from "./wire-pick.ts";
export function wireOperatorStepOperatorModules(pick: PickFn): void {
	configureOperatorStep({
		buildAutofixOutput: pick("buildAutofixOutput", buildAutofixOutput),
		buildCompilerOutput: pick("buildCompilerOutput", buildCompilerOutput),
		buildContextOutput: pick("buildContextOutput", buildContextOutput),
		buildDelegateOutput: pick("buildDelegateOutput", buildDelegateOutput),
		buildExploitLabOutput: pick("buildExploitLabOutput", buildExploitLabOutput),
		buildKernelOutput: pick("buildKernelOutput", buildKernelOutput),
		buildKnowledgeGraphOutput: pick("buildKnowledgeGraphOutput", buildKnowledgeGraphOutput),
		buildMissionDigest: pick("buildMissionDigest", buildMissionDigest),
		buildMobileRuntimeOutput: pick("buildMobileRuntimeOutput", buildMobileRuntimeOutput),
		buildNativeRuntimeOutput: pick("buildNativeRuntimeOutput", buildNativeRuntimeOutput),
		buildOperationOutput: pick("buildOperationOutput", buildOperationOutput),
		buildOperatorOutput: pick("buildOperatorOutput", buildOperatorOutput),
		buildProofLoopOutput: pick("buildProofLoopOutput", buildProofLoopOutput),
		buildReflectOutput: pick("buildReflectOutput", buildReflectOutput),
		buildReplayerOutput: pick("buildReplayerOutput", buildReplayerOutput),
		buildSupervisorOutput: pick("buildSupervisorOutput", buildSupervisorOutput),
		buildSwarmOutput: pick("buildSwarmOutput", buildSwarmOutput),
		buildVerifierOutput: pick("buildVerifierOutput", buildVerifierOutput),
		buildWebAuthzStateOutput: pick("buildWebAuthzStateOutput", buildWebAuthzStateOutput),
		createMission: pick("createMission", createMission),
		dispatchOperatorQueue: pick("dispatchOperatorQueue", dispatchOperatorQueue),
		executeOperationStep: pick("executeOperationStep", executeOperationStep),
		formatMission: pick("formatMission", formatMission),
		formatPlaybookMaintenance: pick("formatPlaybookMaintenance", formatPlaybookMaintenance),
		maintainPlaybooks: pick("maintainPlaybooks", maintainPlaybooks),
		operationStepFromOperator: pick("operationStepFromOperator", operationStepFromOperator),
		routeReconTask: pick("routeReconTask", routeReconTask),
		runAutopilot: pick("runAutopilot", runAutopilot),
		runExploitLab: pick("runExploitLab", runExploitLab),
		runMobileRuntime: pick("runMobileRuntime", runMobileRuntime),
		runNativeRuntime: pick("runNativeRuntime", runNativeRuntime),
		runOperationQueue: pick("runOperationQueue", runOperationQueue),
		runProofLoop: pick("runProofLoop", runProofLoop),
		runReplayer: pick("runReplayer", runReplayer),
		runSwarm: pick("runSwarm", runSwarm),
		runWebAuthzState: pick("runWebAuthzState", runWebAuthzState),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		writeCurrentMission: pick("writeCurrentMission", writeCurrentMission),
	});
}
