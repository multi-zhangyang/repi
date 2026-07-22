/** Wire-proof: configureProofLoop bag. */

import { latestScopedMarkdownArtifact, withScopedMarkdownArtifactSelectionCache } from "../artifact-scope.ts";
import { updateReconCompactionTelemetryFromExecutions } from "../compact-resume.ts";
import { appendEvidence } from "../evidence.ts";
import { readCurrentMission, updateMissionCheckpoint } from "../mission.ts";
import { autonomousExecutionBudget } from "../operator-runtime.ts";
import {
	appendProofLoopMemoryEvent,
	appendRuntimeFailureRepairFromProofLoop,
	buildProofLoopSteps,
	executeProofLoopBridgeStep,
	executeProofLoopQuickPathCommand,
	executeProofLoopStep,
	proofLoopSourceArtifacts,
	refreshProofLoop,
} from "../proof-loop-core.ts";
import { configureProofLoop } from "../proof-loop-runtime.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireProofCompletionLoopModules(pick: PickFn): void {
	configureProofLoop({
		appendEvidence: pick("appendEvidence", appendEvidence),
		appendProofLoopMemoryEvent: pick("appendProofLoopMemoryEvent", appendProofLoopMemoryEvent),
		appendRuntimeFailureRepairFromProofLoop: pick(
			"appendRuntimeFailureRepairFromProofLoop",
			appendRuntimeFailureRepairFromProofLoop,
		),
		autonomousExecutionBudget: pick("autonomousExecutionBudget", autonomousExecutionBudget),
		buildProofLoopSteps: pick("buildProofLoopSteps", buildProofLoopSteps),
		executeProofLoopBridgeStep: pick("executeProofLoopBridgeStep", executeProofLoopBridgeStep),
		executeProofLoopQuickPathCommand: pick("executeProofLoopQuickPathCommand", executeProofLoopQuickPathCommand),
		executeProofLoopStep: pick("executeProofLoopStep", executeProofLoopStep),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		proofLoopSourceArtifacts: pick("proofLoopSourceArtifacts", proofLoopSourceArtifacts),
		readCurrentMission: pick("readCurrentMission", readCurrentMission),
		refreshProofLoop: pick("refreshProofLoop", refreshProofLoop),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		updateReconCompactionTelemetryFromExecutions: pick(
			"updateReconCompactionTelemetryFromExecutions",
			updateReconCompactionTelemetryFromExecutions,
		),
		withScopedMarkdownArtifactSelectionCache: pick(
			"withScopedMarkdownArtifactSelectionCache",
			withScopedMarkdownArtifactSelectionCache,
		),
	});
}
