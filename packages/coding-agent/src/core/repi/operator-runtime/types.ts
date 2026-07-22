/** Operator-runtime types. */

import type { AutonomousExecutionBudget } from "../operator-format-types.ts";
import type { OperationExecution, OperatorStep } from "../operator-step.ts";
import type { CaseMemoryLanePlan } from "../proof-loop-runtime.ts";

export type DispatcherFeedbackParsedRow = {
	category: string;
	status: "passed" | "failed" | "queued";
	score: number;
	command: string;
	raw: string;
};

export type OperatorRuntimeDeps = {
	latestReplayerArtifactPath: (...args: any[]) => any;
	writeDispatcherPromotionPlaybook: (...args: any[]) => any;
	addStep: (...args: any[]) => any;
	appendEvidence: (...args: any[]) => any;
	appendRuntimeFailureRepairFromOperator: (...args: any[]) => any;
	artifactTargetMatches: (...args: any[]) => any;
	autonomousLaneDemotionRows: (...args: any[]) => any;
	caseMemoryLanePlanLines: (...args: any[]) => any;
	commandTargetSuffix: (...args: any[]) => any;
	compactionResumeTelemetryPath: (...args: any[]) => any;
	cumulativeDispatcherScoreDecayRows: (...args: any[]) => any;
	dispatcherScoreDecayRows: (...args: any[]) => any;
	executeOperatorStep: (...args: any[]) => any;
	formatReconCompactionResumeTelemetry: (...args: any[]) => any;
	highScorePromotionRows: (...args: any[]) => any;
	latestAutonomousBudgetLedger: (...args: any[]) => any;
	latestOrBuildContextPack: (...args: any[]) => any;
	latestReconCompactionResumeTelemetry: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	latestSwarmRetryQueue: (...args: any[]) => any;
	repeatedFailureDemotionRows: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	updateReconCompactionTelemetryFromOperator: (...args: any[]) => any;
	workerScoreDemotionRows: (...args: any[]) => any;
};

export type OperatorArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "dispatch" | "verify" | "escalate";
	contextArtifact?: string;
	steps: OperatorStep[];
	executed: OperationExecution[];
	commanderPolicy: string[];
	commanderDispatchReport: string[];
	caseMemoryLanePlan?: CaseMemoryLanePlan;
	caseMemoryDispatchReport: string[];
	operatorFeedback: string[];
	operatorFeedbackQueue: string[];
	dispatcherFallbackPlan: string[];
	dispatcherFeedbackScoreboard: string[];
	dispatcherLearningHints: string[];
	autonomousBudget: AutonomousExecutionBudget;
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	compactResumeTelemetry: string[];
	compactResumeQueue: string[];
	verification: string[];
	escalationQueue: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};
