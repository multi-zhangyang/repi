/** Wire-operator: configureOperatorRuntime bag. */

import { artifactTargetMatches, latestScopedMarkdownArtifact } from "../artifact-scope.ts";
import {
	autonomousLaneDemotionRows,
	cumulativeDispatcherScoreDecayRows,
	dispatcherScoreDecayRows,
	highScorePromotionRows,
	latestAutonomousBudgetLedger,
	repeatedFailureDemotionRows,
	workerScoreDemotionRows,
} from "../autonomous-budget.ts";
import {
	formatReconCompactionResumeTelemetry,
	latestReconCompactionResumeTelemetry,
	updateReconCompactionTelemetryFromOperator,
} from "../compact-resume.ts";
import { commandTargetSuffix, latestOrBuildContextPack } from "../context-pack.ts";
import { appendEvidence } from "../evidence.ts";
import { appendRuntimeFailureRepairFromOperator } from "../failure-repair.ts";
import { writeDispatcherPromotionPlaybook } from "../memory-stubs.ts";
import { updateMissionCheckpoint } from "../mission.ts";
import {
	bootstrapToolFromCommand,
	commanderPolicyFromContext,
	configureOperatorRuntime,
	latestOperatorFeedback,
	operatorCommandConcrete,
	operatorFeedbackDispatcherCommands,
	operatorFeedbackDispatchPlan,
	operatorFeedbackNextCommands,
	operatorStepPriority,
} from "../operator-runtime.ts";
import { executeOperatorStep } from "../operator-step.ts";
import { caseMemoryLanePlanLines } from "../proof-loop-runtime.ts";
import { latestReplayerArtifactPath } from "../replayer-runtime.ts";
import { compactionResumeTelemetryPath } from "../storage.ts";
import { latestSwarmRetryQueue } from "../swarm-runtime.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireOperatorStepRuntimeModules(pick: PickFn): void {
	configureOperatorRuntime({
		writeDispatcherPromotionPlaybook: pick("writeDispatcherPromotionPlaybook", writeDispatcherPromotionPlaybook),
		operatorFeedbackNextCommands: pick("operatorFeedbackNextCommands", operatorFeedbackNextCommands),
		bootstrapToolFromCommand: pick("bootstrapToolFromCommand", bootstrapToolFromCommand),
		appendEvidence: pick("appendEvidence", appendEvidence),
		appendRuntimeFailureRepairFromOperator: pick(
			"appendRuntimeFailureRepairFromOperator",
			appendRuntimeFailureRepairFromOperator,
		),
		artifactTargetMatches: pick("artifactTargetMatches", artifactTargetMatches),
		autonomousLaneDemotionRows: pick("autonomousLaneDemotionRows", autonomousLaneDemotionRows),
		caseMemoryLanePlanLines: pick("caseMemoryLanePlanLines", caseMemoryLanePlanLines),
		commandTargetSuffix: pick("commandTargetSuffix", commandTargetSuffix),
		commanderPolicyFromContext: pick("commanderPolicyFromContext", commanderPolicyFromContext),
		compactionResumeTelemetryPath: pick("compactionResumeTelemetryPath", compactionResumeTelemetryPath),
		cumulativeDispatcherScoreDecayRows: pick(
			"cumulativeDispatcherScoreDecayRows",
			cumulativeDispatcherScoreDecayRows,
		),
		dispatcherScoreDecayRows: pick("dispatcherScoreDecayRows", dispatcherScoreDecayRows),
		executeOperatorStep: pick("executeOperatorStep", executeOperatorStep),
		formatReconCompactionResumeTelemetry: pick(
			"formatReconCompactionResumeTelemetry",
			formatReconCompactionResumeTelemetry,
		),
		highScorePromotionRows: pick("highScorePromotionRows", highScorePromotionRows),
		latestAutonomousBudgetLedger: pick("latestAutonomousBudgetLedger", latestAutonomousBudgetLedger),
		latestOperatorFeedback: pick("latestOperatorFeedback", latestOperatorFeedback),
		latestOrBuildContextPack: pick("latestOrBuildContextPack", latestOrBuildContextPack),
		latestReplayerArtifactPath: pick("latestReplayerArtifactPath", latestReplayerArtifactPath),
		latestReconCompactionResumeTelemetry: pick(
			"latestReconCompactionResumeTelemetry",
			latestReconCompactionResumeTelemetry,
		),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		latestSwarmRetryQueue: pick("latestSwarmRetryQueue", latestSwarmRetryQueue),
		operatorCommandConcrete: pick("operatorCommandConcrete", operatorCommandConcrete),
		operatorFeedbackDispatchPlan: pick("operatorFeedbackDispatchPlan", operatorFeedbackDispatchPlan),
		operatorFeedbackDispatcherCommands: pick(
			"operatorFeedbackDispatcherCommands",
			operatorFeedbackDispatcherCommands,
		),
		operatorStepPriority: pick("operatorStepPriority", operatorStepPriority),
		repeatedFailureDemotionRows: pick("repeatedFailureDemotionRows", repeatedFailureDemotionRows),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		updateReconCompactionTelemetryFromOperator: pick(
			"updateReconCompactionTelemetryFromOperator",
			updateReconCompactionTelemetryFromOperator,
		),
		workerScoreDemotionRows: pick("workerScoreDemotionRows", workerScoreDemotionRows),
	});
}
