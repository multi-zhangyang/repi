/** Runtime types: other. */
import type { ReconParallelPlanWorkerV1 } from "./swarm-worker.ts";

export type ReconParallelPlanV1 = {
	kind: "ReconParallelPlanV1";
	schemaVersion: 1;
	planId: string;
	target?: string;
	source: "re_swarm" | "frontier-orchestrator" | "agent-dogfood" | "hard-eval-control-plane" | "operator" | "manual";
	strategy?: string;
	workers: ReconParallelPlanWorkerV1[];
	merge: {
		strategy: "supervisor" | "synthesizer" | "frontier-summary" | "claim-ledger";
		evidenceOrder: string[];
		expectedArtifacts: string[];
		command?: string;
		conflictPolicy?: string;
	};
};
