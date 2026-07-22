import type {
	StrictClaimCheckSnapshot,
	StructuredClaimMergeCheckSnapshot,
	SupervisorVerdict,
} from "../runtime-types/claim.ts";
import type { ReconParallelPlanV1 } from "../runtime-types/other.ts";
import type { SupervisorWorkerReview } from "../runtime-types/swarm-worker-review.ts";

/** Supervisor types. */
export type SupervisorArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "review" | "repair";
	delegationArtifact?: string;
	swarmArtifact?: string;
	supervisorVerdict: SupervisorVerdict;
	reviews: SupervisorWorkerReview[];
	conflicts: string[];
	repairQueue: string[];
	commanderMergeQueue: string[];
	commanderMergeBudget: string[];
	workerScoreboard: string[];
	priorityQueue: string[];
	checkpoints: string[];
	nextActions: string[];
	parallelPlan?: ReconParallelPlanV1;
	planCoverage: string[];
	releaseCheckMetadata: string[];
	claimCheckPolicy: string[];
	strictClaimCheck?: StrictClaimCheckSnapshot;
	claimCheckResult: string[];
	structuredClaimMergeCheck?: StructuredClaimMergeCheckSnapshot;
	llmCritique?: string;
	sourceArtifacts: string[];
};

export type SupervisorDeps = {
	[key: string]: any;
	appendEvidence: (...args: any[]) => any;
	buildClaimCheckResult: (...args: any[]) => any;
	latestOrBuildDelegate: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	readCurrentMission: (...args: any[]) => any;
	reviewSwarmWorkerRuntime: (...args: any[]) => any;
	strictClaimCheckSnapshot: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;

	commanderWorkerScoreboard?: (...args: any[]) => any;
	latestSwarmForSupervisor?: (...args: any[]) => any;
	supervisorClaimCheckPolicy?: (...args: any[]) => any;
	supervisorPlanCoverage?: (...args: any[]) => any;
	swarmCommanderMergeQueue?: (...args: any[]) => any;
};
