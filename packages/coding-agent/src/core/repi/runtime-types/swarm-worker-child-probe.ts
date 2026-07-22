/** Worker child process probe + batch types. */
import type {
	WorkerChildSessionClaimLedgerEventV1,
	WorkerChildSessionLaunchPolicyV1,
	WorkerChildSessionRuntimeV1,
} from "./swarm-worker-child-policy.ts";
import type { WorkerRuntimePoolV1 } from "./swarm-worker-pool.ts";

export type WorkerChildProcessProbeV1 = {
	kind: "WorkerChildProcessProbeV1";
	schemaVersion: 1;
	probeId: string;
	command: string;
	args: string[];
	cwd: string;
	isolatedHome: string;
	startedAt: string;
	endedAt: string;
	elapsedMs: number;
	exitCode: number | null;
	signal: string | null;
	status: "pass" | "blocked";
	stdoutPath: string;
	stderrPath: string;
	stdoutSha256: string;
	stderrSha256: string;
	envAllowlist: string[];
	envDenylist: string[];
	assertions: {
		repiCommandExecuted: boolean;
		isolatedRepiHome: boolean;
		noPiHomeImport: boolean;
		updateChecksDisabled: boolean;
		telemetryDisabled: boolean;
		noLiteralSecrets: boolean;
		stdoutCaptured: boolean;
	};
	errors: string[];
};

export type WorkerProviderChildProcessProbeV1 = {
	kind: "WorkerProviderChildProcessProbeV1";
	schemaVersion: 1;
	probeId: string;
	providerName: string;
	modelId: string;
	command: string;
	args: string[];
	cwd: string;
	isolatedHome: string;
	modelsJsonPath: string;
	requestLogPath: string;
	transcriptPath: string;
	stdoutPath: string;
	stderrPath: string;
	stdoutSha256: string;
	stderrSha256: string;
	requestLogSha256: string;
	transcriptSha256: string;
	startedAt: string;
	endedAt: string;
	elapsedMs: number;
	exitCode: number | null;
	signal: string | null;
	status: "pass" | "blocked";
	assertions: {
		openAICompatibleRequestSeen: boolean;
		modelMatched: boolean;
		stdoutMarkerObserved: boolean;
		apiKeyEnvRefOnly: boolean;
		authorizationFromEnv: boolean;
		transcriptCaptured: boolean;
		noPiHomeImport: boolean;
		noUpdateBanner: boolean;
		noLiteralSecrets: boolean;
	};
	request: {
		method?: string;
		path?: string;
		model?: string;
		stream?: boolean;
		authorizationHeaderSha256?: string;
		bodySha256?: string;
	};
	errors: string[];
};

export type WorkerChildSessionRuntimeBatchV1 = {
	kind: "WorkerChildSessionRuntimeBatchV1";
	schemaVersion: 1;
	batchId: string;
	poolId: string;
	resourceBudget: WorkerRuntimePoolV1["resourceBudget"];
	launchPolicy: WorkerChildSessionLaunchPolicyV1;
	sessions: WorkerChildSessionRuntimeV1[];
	claimLedgerEvents: WorkerChildSessionClaimLedgerEventV1[];
	childProcessProbe?: WorkerChildProcessProbeV1;
	providerChildProcessProbe?: WorkerProviderChildProcessProbeV1;
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
