/** Swarm-runtime types. */
import type { DelegateWorker } from "../operator-format.ts";
import type { ReconParallelPlanV1 } from "../runtime-types/other.ts";
import type { WorkerChildSessionRuntimeBatchV1 } from "../runtime-types/swarm-worker-child-probe.ts";
import type { SwarmSubagentRuntimeManifestRow } from "../runtime-types/swarm-worker-manifest.ts";
import type { WorkerRuntimePoolV1 } from "../runtime-types/swarm-worker-pool.ts";
import type { StructuredClaimMergeV1 } from "../structured-claim-merge/deps.ts";
import type { SwarmClaimLedgerEventV1 } from "../swarm-claim-ledger/types.ts";
import type { SwarmWorkerExecution } from "../swarm-exec.ts";
import type { WorkerLeaseSchedulerV1 } from "../worker-lease-scheduler-types.ts";
import type {
	RepiWorkerRetryHandoffClosureV1,
	RepiWorkerRetryHandoffMergeSummaryV1,
} from "../worker-runtime/types/handoff.ts";

export type SwarmRuntimeDeps = {
	[key: string]: any;
	operatorCommandConcrete: (...args: any[]) => any;
	appendEvidence: (...args: any[]) => any;
	deriveSwarmAuditFields: (...args: any[]) => any;
	latestOrBuildDelegate: (...args: any[]) => any;
	latestScopedMarkdownArtifact: (...args: any[]) => any;
	refreshSwarmRunDerivedFields: (...args: any[]) => any;
	refreshSwarmRuntimeClaimLedger: (...args: any[]) => any;
	refreshSwarmSubagentRuntimeManifestCapture?: (...args: any[]) => any;
	refreshSwarmWorkerChildSessionRuntime?: (...args: any[]) => any;
	refreshSwarmWorkerLeaseScheduler?: (...args: any[]) => any;
	refreshSwarmWorkerRetryHandoffClosure?: (...args: any[]) => any;
	scopedMarkdownArtifacts: (...args: any[]) => any;
	updateMissionCheckpoint: (...args: any[]) => any;
};

export type SwarmArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	mode: "plan" | "run" | "merge";
	delegationArtifact?: string;
	workers: SwarmWorkerRuntime[];
	executions: SwarmWorkerExecution[];
	workerResults: string[];
	blocked: string[];
	mergeDigest: string[];
	executionAudit: string[];
	coverageMatrix: string[];
	retryQueue: string[];
	parallelGroups: string[];
	mergeProtocol: string[];
	collisionMatrix: string[];
	evidenceContract: string[];
	commanderNextActions: string[];
	handoffDigest: string[];
	parallelPlan?: ReconParallelPlanV1;
	planCoverage: string[];
	releaseCheckMetadata: string[];
	claimLedger: SwarmClaimLedgerEventV1[];
	claimLedgerPath?: string;
	claimLedgerEventCount: number;
	claimLedgerTipHash?: string;
	runtimeClaimLedgerCaptured: boolean;
	structuredClaimMerge?: StructuredClaimMergeV1;
	structuredClaimMergePath?: string;
	structuredClaimMergeStatus?: "pass" | "blocked" | "missing";
	structuredClaimMergeErrors: string[];
	subagentRuntimeManifestPath?: string;
	subagentRuntimeManifests: SwarmSubagentRuntimeManifestRow[];
	subagentRuntimeManifestCount: number;
	subagentRuntimeManifestsCaptured: boolean;
	workerChildSessionRuntimePath?: string;
	workerChildSessionRuntime?: WorkerChildSessionRuntimeBatchV1;
	workerChildSessionRuntimeStatus?: "pass" | "blocked" | "missing";
	workerChildSessionRuntimeErrors: string[];
	workerLeaseSchedulerPath?: string;
	workerLeaseScheduler?: WorkerLeaseSchedulerV1;
	workerLeaseSchedulerStatus?: "pass" | "blocked" | "missing";
	workerLeaseSchedulerErrors: string[];
	workerRuntimePoolBridge?: WorkerRuntimePoolV1;
	workerRuntimePoolBridgeStatus?: "pass" | "blocked" | "missing";
	workerRuntimePoolBridgeErrors: string[];
	workerRetryHandoffClosurePath?: string;
	workerRetryHandoffClosure?: RepiWorkerRetryHandoffClosureV1;
	workerRetryHandoffClosureStatus?: "pass" | "blocked" | "missing";
	workerRetryHandoffClosureErrors: string[];
	workerRetryHandoffMergeSummaryPath?: string;
	workerRetryHandoffMergeSummary?: RepiWorkerRetryHandoffMergeSummaryV1;
	workerRetryHandoffMergeSummaryStatus?: "pass" | "blocked" | "missing";
	workerRetryHandoffMergeSummaryErrors: string[];
	memoryWritebackEvents: string[];
	memoryWritebackCount: number;
	memoryWritebackStatus: "pending" | "pass" | "skipped" | "blocked";
	memoryWritebackErrors: string[];
	sourceArtifacts: string[];
};

export type SwarmWorkerRuntime = {
	id: string;
	worker: DelegateWorker;
	status: "ready" | "blocked" | "done" | "merged";
	objective: string;
	spawnPrompt: string[];
	commands: string[];
	evidenceContract: string[];
	mergeKeys: string[];
	dependencies: string[];
	recommendedTools: string[];
	sourceArtifacts: string[];
};
