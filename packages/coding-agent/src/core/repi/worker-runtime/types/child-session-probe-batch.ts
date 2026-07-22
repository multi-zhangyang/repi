/** Child-session runtime batch types. */
// Landmark: RepiWorkerChildSessionRuntimeBatchV1
import type {
	RepiWorkerChildSessionClaimLedgerEventV1,
	RepiWorkerChildSessionLaunchPolicyV1,
	RepiWorkerChildSessionRuntimeV1,
} from "./child-session-policy.ts";
import type { RepiWorkerChildProcessProbeV1, RepiWorkerProviderChildProcessProbeV1 } from "./child-session-probe.ts";
import type { RepiWorkerRuntimePoolV1 } from "./pool.ts";

export type RepiWorkerChildSessionRuntimeBatchV1 = {
	kind: "WorkerChildSessionRuntimeBatchV1";
	schemaVersion: 1;
	batchId: string;
	poolId: string;
	resourceBudget: RepiWorkerRuntimePoolV1["resourceBudget"];
	launchPolicy: RepiWorkerChildSessionLaunchPolicyV1;
	sessions: RepiWorkerChildSessionRuntimeV1[];
	claimLedgerEvents: RepiWorkerChildSessionClaimLedgerEventV1[];
	childProcessProbe?: RepiWorkerChildProcessProbeV1;
	providerChildProcessProbe?: RepiWorkerProviderChildProcessProbeV1;
	poolBridge: {
		kind: "WorkerRuntimePoolV1Bridge";
		poolId: string;
		workerIds: string[];
		claimAwareMerge: boolean;
		childSessionRuntimeCaptured: boolean;
		childProcessRuntimeCaptured?: boolean;
		providerChildProcessRuntimeCaptured?: boolean;
	};
};
