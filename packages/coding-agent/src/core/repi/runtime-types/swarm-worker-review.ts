/** Runtime types: parallel plan + supervisor worker review. */
import type { DelegateWorker } from "../operator-format-types.ts";
import type { SupervisorVerdict } from "./claim.ts";

export type ReconParallelPlanWorkerV1 = {
	id: string;
	role: string;
	objective: string;
	commands: string[];
	evidenceContract: string[];
	mergeKeys: string[];
	dependencies: string[];
	artifactGlobs: string[];
	limits: Record<string, unknown>;
	prompt?: string[];
	sourceWorkerId?: string;
};

export type SupervisorWorkerReview = {
	packetId: string;
	worker: DelegateWorker;
	verdict: SupervisorVerdict;
	score: number;
	priority: number;
	rationale: string[];
	conflicts: string[];
	evidenceGaps: string[];
	repairActions: string[];
};
