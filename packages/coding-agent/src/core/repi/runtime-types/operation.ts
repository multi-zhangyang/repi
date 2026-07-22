import type { OperationStep } from "../operation-step-deps.ts";
import type { OperationExecution } from "../operator-step-deps.ts";
/** Runtime types: operation. */

export type OperationArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	campaignArtifact?: string;
	mode: "plan" | "run";
	steps: OperationStep[];
	executed: OperationExecution[];
	blocked: string[];
	nextActions: string[];
	sourceArtifacts: string[];
};
