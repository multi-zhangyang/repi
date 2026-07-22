import type { AutonomousExecutionBudget } from "../operator-format-types.ts";
import type { OperationExecution } from "../operator-step-deps.ts";

/** Proof-loop runtime types. */
export type ProofLoopPhase =
	| "compact-resume"
	| "failure-signature"
	| "operator-feedback"
	| "swarm-retry"
	| "attack-graph"
	| "runtime-adapter"
	| "verifier"
	| "compiler"
	| "replayer"
	| "autofix"
	| "case-memory"
	| "knowledge"
	| "completion";

export type ProofLoopStatus = "ready" | "done" | "blocked";

export type ProofLoopVerdict = "ready" | "partial" | "needs_repair" | "blocked";

export type CaseMemoryLanePlan = {
	action: "none" | "reprioritized" | "added" | "skipped";
	reason: string;
	targetLane?: string;
	addedLane?: string;
	skippedLane?: string;
	migrations: string[];
	next: string[];
};

export type ProofLoopArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "run";
	maxSteps: number;
	replaySteps: number;
	steps: ProofLoopStep[];
	executed: OperationExecution[];
	verdict: ProofLoopVerdict;
	checkStatus: string[];
	evidenceSummary: string[];
	gapClassifier: string[];
	quickPath: string[];
	quickPlanPhases: string[];
	quickPlanAssertions: string[];
	runtimeAdapterClosure: string[];
	caseMemoryLanePlan?: CaseMemoryLanePlan;
	caseMemoryBridge: string[];
	failureSignaturePriority: string[];
	failureSignatureRepairQueue: string[];
	operatorFeedback: string[];
	operatorFeedbackQueue: string[];
	swarmRetryQueue: string[];
	specialistQueue: string[];
	swarmBridge: string[];
	autonomousBudget: AutonomousExecutionBudget;
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	compactResumeTelemetry: string[];
	compactResumeQueue: string[];
	bridgeArtifacts: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};

export type ProofLoopStep = {
	id: string;
	phase: ProofLoopPhase;
	command: string;
	status: ProofLoopStatus;
	reason?: string;
	sourceArtifacts: string[];
};

export type ProofLoopRuntimeAdapterClosureRow = {
	adapterId: string;
	status: string;
	missingProofSignals: string[];
	matchedProofSignals: string[];
	commands: string[];
	sourceArtifacts: string[];
};

export type ProofLoopDeps = {
	appendEvidence: (...args: any[]) => any;
	appendProofLoopMemoryEvent: (...args: any[]) => any;
	appendRuntimeFailureRepairFromProofLoop: (...args: any[]) => any;
	autonomousExecutionBudget: (...args: any[]) => any;
	buildProofLoopSteps: (...args: any[]) => any;
	executeProofLoopBridgeStep: (...args: any[]) => any;
	executeProofLoopQuickPathCommand: (...args: any[]) => any;
	executeProofLoopStep: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	proofLoopSourceArtifacts: (...args: any[]) => any;
	readCurrentMission: (...args: any[]) => any;
	refreshProofLoop: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	updateReconCompactionTelemetryFromExecutions: (...args: any[]) => any;
	withScopedMarkdownArtifactSelectionCache: (...args: any[]) => any;
};

const _proofLoopDeps: ProofLoopDeps | null = null;
