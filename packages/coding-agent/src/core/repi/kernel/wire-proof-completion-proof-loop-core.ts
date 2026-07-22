/** Wire-proof: configureProofLoopCore bag. */

import { artifactTargetMatches } from "../artifact-scope.ts";
import { buildAttackGraphOutput, latestAttackGraphArtifactPath, parseAttackGraphArtifact } from "../attack-graph.ts";
import { parseAutofixArtifact } from "../autofix.ts";
import { runAutopilot } from "../autopilot.ts";
import { latestReconCompactionResumeTelemetry } from "../compact-resume.ts";
import { buildCompilerOutput, latestCompilerArtifactPath, parseCompilerArtifact } from "../compiler-runtime.ts";
import { latestDecisionCoreArtifactPath } from "../decision-runtime.ts";
import { buildDelegateOutput, delegateEvidenceContract, latestDelegateArtifactPath } from "../delegate.ts";
import {
	appendRuntimeFailureInputs,
	failureSignaturePriorityReport,
	runtimeFailureCategory,
} from "../failure-repair.ts";
import { runtimeAdapterMitigationEvidenceForGraph, runtimeAdapterParserSummaryForGraph } from "../graph-artifacts.ts";
import { buildKnowledgeGraphOutput, latestKnowledgeGraphArtifactPath } from "../knowledge-graph.ts";
import { appendMemoryEvent } from "../memory-transaction.ts";
import {
	autonomousExecutionBudget,
	buildOperatorOutput,
	latestOperatorArtifactPath,
	latestOperatorFeedback,
	operatorCommandConcrete,
	operatorFeedbackDispatcherCommands,
	operatorStepPriority,
} from "../operator-runtime.ts";
import { configureProofLoopCore } from "../proof-loop-core.ts";
import { runtimeFailureCommandTarget } from "../repair-rollback.ts";
import { latestReplayerArtifactPath, parseReplayArtifact, runReplayer } from "../replayer-runtime.ts";
import { buildSwarmOutput, latestSwarmArtifactPath, latestSwarmRetryQueue } from "../swarm-runtime.ts";
import { buildVerifierOutput, latestVerifierArtifactPath, parseVerifierArtifact } from "../verifier-runtime.ts";
import type { PickFn } from "./wire-pick.ts";
export function wireProofCompletionLoopCoreModules(pick: PickFn): void {
	configureProofLoopCore({
		appendMemoryEvent: pick("appendMemoryEvent", appendMemoryEvent),
		appendRuntimeFailureInputs: pick("appendRuntimeFailureInputs", appendRuntimeFailureInputs),
		artifactTargetMatches: pick("artifactTargetMatches", artifactTargetMatches),
		autonomousExecutionBudget: pick("autonomousExecutionBudget", autonomousExecutionBudget),
		buildAttackGraphOutput: pick("buildAttackGraphOutput", buildAttackGraphOutput),
		buildCompilerOutput: pick("buildCompilerOutput", buildCompilerOutput),
		buildDelegateOutput: pick("buildDelegateOutput", buildDelegateOutput),
		buildKnowledgeGraphOutput: pick("buildKnowledgeGraphOutput", buildKnowledgeGraphOutput),
		buildOperatorOutput: pick("buildOperatorOutput", buildOperatorOutput),
		buildSwarmOutput: pick("buildSwarmOutput", buildSwarmOutput),
		buildVerifierOutput: pick("buildVerifierOutput", buildVerifierOutput),
		delegateEvidenceContract: pick("delegateEvidenceContract", delegateEvidenceContract),
		failureSignaturePriorityReport: pick("failureSignaturePriorityReport", failureSignaturePriorityReport),
		latestAttackGraphArtifactPath: pick("latestAttackGraphArtifactPath", latestAttackGraphArtifactPath),
		latestCompilerArtifactPath: pick("latestCompilerArtifactPath", latestCompilerArtifactPath),
		latestDecisionCoreArtifactPath: pick("latestDecisionCoreArtifactPath", latestDecisionCoreArtifactPath),
		latestDelegateArtifactPath: pick("latestDelegateArtifactPath", latestDelegateArtifactPath),
		latestKnowledgeGraphArtifactPath: pick("latestKnowledgeGraphArtifactPath", latestKnowledgeGraphArtifactPath),
		latestOperatorArtifactPath: pick("latestOperatorArtifactPath", latestOperatorArtifactPath),
		latestOperatorFeedback: pick("latestOperatorFeedback", latestOperatorFeedback),
		latestReconCompactionResumeTelemetry: pick(
			"latestReconCompactionResumeTelemetry",
			latestReconCompactionResumeTelemetry,
		),
		latestReplayerArtifactPath: pick("latestReplayerArtifactPath", latestReplayerArtifactPath),
		latestSwarmArtifactPath: pick("latestSwarmArtifactPath", latestSwarmArtifactPath),
		latestSwarmRetryQueue: pick("latestSwarmRetryQueue", latestSwarmRetryQueue),
		latestVerifierArtifactPath: pick("latestVerifierArtifactPath", latestVerifierArtifactPath),
		operatorCommandConcrete: pick("operatorCommandConcrete", operatorCommandConcrete),
		operatorFeedbackDispatcherCommands: pick(
			"operatorFeedbackDispatcherCommands",
			operatorFeedbackDispatcherCommands,
		),
		operatorStepPriority: pick("operatorStepPriority", operatorStepPriority),
		parseAttackGraphArtifact: pick("parseAttackGraphArtifact", parseAttackGraphArtifact),
		parseAutofixArtifact: pick("parseAutofixArtifact", parseAutofixArtifact),
		parseCompilerArtifact: pick("parseCompilerArtifact", parseCompilerArtifact),
		parseReplayArtifact: pick("parseReplayArtifact", parseReplayArtifact),
		parseVerifierArtifact: pick("parseVerifierArtifact", parseVerifierArtifact),
		runAutopilot: pick("runAutopilot", runAutopilot),
		runReplayer: pick("runReplayer", runReplayer),
		runtimeAdapterMitigationEvidenceForGraph: pick(
			"runtimeAdapterMitigationEvidenceForGraph",
			runtimeAdapterMitigationEvidenceForGraph,
		),
		runtimeAdapterParserSummaryForGraph: pick(
			"runtimeAdapterParserSummaryForGraph",
			runtimeAdapterParserSummaryForGraph,
		),
		runtimeFailureCategory: pick("runtimeFailureCategory", runtimeFailureCategory),
		runtimeFailureCommandTarget: pick("runtimeFailureCommandTarget", runtimeFailureCommandTarget),
	});
}
