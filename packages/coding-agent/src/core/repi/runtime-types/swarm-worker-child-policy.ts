/** Worker child session launch policy + runtime types. */

import type { SwarmClaimLedgerEventV1 } from "../swarm-claim-ledger/types.ts";
import type { SwarmRuntimeRetryBudget } from "../swarm-exec.ts";
import type { WorkerChildSessionProviderFormat, WorkerChildSessionRuntimeStatus } from "./swarm-worker-child-status.ts";
import type { WorkerRuntimePoolWorkerV1 } from "./swarm-worker-pool.ts";

export type WorkerChildSessionLaunchPolicyV1 = {
	command: "repi";
	args: string[];
	cwd: string;
	isolatedHome: string;
	profileDir: string;
	timeoutMs: number;
	cancelSignal: "SIGTERM";
	killAfterMs: number;
	importPiAuth: false;
	updateChecksDisabled: true;
	telemetryDisabled: true;
	envAllowlist: string[];
	envDenylist: string[];
};

export type WorkerChildSessionRuntimeV1 = {
	sessionId: string;
	workerId: string;
	packetId: string;
	attempt: number;
	maxAttempts: number;
	provider: {
		format: WorkerChildSessionProviderFormat;
		name: string;
		modelId: string;
		baseUrlRef: string;
		apiKeyRef: string;
		contextWindow: number;
		maxTokens: number;
	};
	runtime: {
		status: WorkerChildSessionRuntimeStatus;
		pid?: number | null;
		sessionDir: string;
		transcriptPath: string;
		stdoutPath: string;
		stderrPath: string;
		startedAt: string;
		endedAt: string;
		exitCode?: number | null;
		signal?: string | null;
		cancelledAt?: string;
	};
	hashes: {
		transcriptSha256: string;
		stdoutSha256: string;
		stderrSha256: string;
		toolCallDigest: string;
	};
	resourceLease: WorkerRuntimePoolWorkerV1["resourceLease"];
	retryBudget: SwarmRuntimeRetryBudget;
	poolBridge: {
		poolId: string;
		mergeKey: string;
		claimRefs: string[];
		workerRuntimePoolStatus: WorkerRuntimePoolWorkerV1["status"];
	};
	failureRepairRefs: string[];
};

export type WorkerChildSessionClaimLedgerEventV1 = Omit<SwarmClaimLedgerEventV1, "source"> & {
	source: "re_swarm" | "worker-child-session";
};
