/** Runtime types: parallel provider worker matrix (aggregate). */
// Landmark: ParallelProviderWorkerMatrixV1
import type { FailureLedgerEventV1, RepairQueueItemV1 } from "../failure-repair/types.ts";
import type { ParallelProviderWorkerMatrixWorkerV1 } from "./provider-parallel.ts";

export type ParallelProviderWorkerMatrixV1 = {
	kind: "ParallelProviderWorkerMatrixV1";
	schemaVersion: 1;
	generatedAt: string;
	poolId: string;
	isolatedHome: string;
	workspace: string;
	modelsJsonPath: string;
	maxConcurrency: number;
	peakConcurrency: number;
	listModels: {
		status: "pass" | "blocked";
		providers: string[];
		stdoutSha256: string;
		stderrSha256: string;
	};
	workers: ParallelProviderWorkerMatrixWorkerV1[];
	claimMerge: {
		strategy: "claim-aware provider worker merge";
		claimAwareProviderWorkerMerge: boolean;
		conflicts: {
			mergeKey: string;
			workers: string[];
			status: "resolved" | "open";
			winner?: string;
			evidenceRefs: string[];
			resolutionReason: string;
		}[];
	};
	failureLedgerEvents: FailureLedgerEventV1[];
	repairQueue: RepairQueueItemV1[];
	failureRepairValidation: {
		ok: boolean;
		failureCount: number;
		repairCount: number;
	};
	writebackProbe: {
		status: "pass" | "blocked";
		writeback: {
			failurePath: string;
			repairPath: string;
		};
		validation: {
			ok: boolean;
			failureCount: number;
			repairCount: number;
		};
	};
};
