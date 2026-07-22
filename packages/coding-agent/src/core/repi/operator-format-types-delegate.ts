/** Delegate worker/packet artifact types. */
import type { AutonomousExecutionBudget } from "./operator-format-types-operator.ts";
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
	steps: unknown[];
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
