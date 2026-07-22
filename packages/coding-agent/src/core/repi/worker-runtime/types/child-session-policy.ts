/** Child-session launch policy + runtime types. */
import type {
	RepiWorkerChildSessionProviderFormat,
	RepiWorkerChildSessionRuntimeStatus,
} from "./child-session-status.ts";
import type { RepiWorkerRuntimePoolWorkerV1 } from "./pool.ts";
/** Worker-runtime types: child-session. */
import type { RepiSwarmClaimLedgerEventV1, RepiSwarmRuntimeRetryBudget } from "./swarm.ts";

export type RepiWorkerChildSessionLaunchPolicyV1 = {
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

export type RepiWorkerChildSessionRuntimeV1 = {
	sessionId: string;
	workerId: string;
	packetId: string;
	attempt: number;
	maxAttempts: number;
	provider: {
		format: RepiWorkerChildSessionProviderFormat;
		name: string;
		modelId: string;
		baseUrlRef: string;
		apiKeyRef: string;
		contextWindow: number;
		maxTokens: number;
	};
	runtime: {
		status: RepiWorkerChildSessionRuntimeStatus;
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
	resourceLease: RepiWorkerRuntimePoolWorkerV1["resourceLease"];
	retryBudget: RepiSwarmRuntimeRetryBudget;
	poolBridge: {
		poolId: string;
		mergeKey: string;
		claimRefs: string[];
		workerRuntimePoolStatus: RepiWorkerRuntimePoolWorkerV1["status"];
	};
	failureRepairRefs: string[];
};

export type RepiWorkerChildSessionClaimLedgerEventV1 = Omit<RepiSwarmClaimLedgerEventV1, "source"> & {
	source: "re_swarm" | "worker-child-session";
};
