import type { AutonomousExecutionBudget } from "../operator-format-types.ts";

/** Delegate types. */
export type DelegateWorker =
	| "web-authz"
	| "identity"
	| "cloud"
	| "mobile-runtime"
	| "native-runtime"
	| "pwn-exploit"
	| "firmware-dfir"
	| "agentsec"
	| "malware"
	| "reporting"
	| "general";

export type DelegatePacket = {
	id: string;
	worker: DelegateWorker;
	objective: string;
	status: "ready" | "blocked" | "done";
	phases: string[];
	steps: any[];
	evidenceContract: string[];
	recommendedTools: string[];
	handoffPrompt: string[];
	sourceArtifacts: string[];
};

export type DelegateArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "merge";
	operationArtifact?: string;
	packets: DelegatePacket[];
	mergeQueue: string[];
	specialistCoverage: string[];
	workerScoreboard: string[];
	adaptiveRoutingHints: string[];
	workerPromotionQueue: string[];
	autonomousBudget: AutonomousExecutionBudget;
	dispatcherScoreDecay: string[];
	repeatedFailureDemotions: string[];
	highScorePromotions: string[];
	gaps: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};

export type DelegateDeps = {
	[key: string]: any;
	appendEvidence: (...args: any[]) => any;
	autonomousExecutionBudget: (...args: any[]) => any;
	delegateEvidenceContract: (...args: any[]) => any;
	delegateObjective: (...args: any[]) => any;
	delegateTools: (...args: any[]) => any;
	dispatcherAdaptiveRoutingHints: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	operatorCommandConcrete: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
	workerAdaptiveRoutingHints: (...args: any[]) => any;

	buildWorkerPromotionQueue?: (...args: any[]) => any;

	dispatcherPromotionQueue?: (...args: any[]) => any;
	latestWorkerScoreboard?: (...args: any[]) => any;
};

const _delegateDeps: DelegateDeps | null = null;

export type DelegateWorkerScoreboardEntry = {
	worker: DelegateWorker;
	packetId: string;
	verdict: string;
	score: number;
	retryBudget: number;
	failureCost: number;
	next: string;
	raw: string;
};
