/** Runtime types: parallel provider worker matrix worker. */
// Landmark: ParallelProviderWorkerMatrixWorkerV1

export type ParallelProviderWorkerMatrixWorkerV1 = {
	kind: "ParallelProviderWorkerMatrixWorkerV1";
	schemaVersion: 1;
	workerId: string;
	role: string;
	providerName: string;
	api: "openai-completions" | "anthropic-messages";
	modelId: string;
	expectedPath: "/v1/chat/completions" | "/v1/messages";
	mode: "pass" | "failure" | "timeout";
	status: "pass" | "repair_queued" | "cancelled" | "blocked";
	mergeKey: string;
	claimRefs: string[];
	startedAt: string;
	endedAt: string;
	elapsedMs: number;
	timeoutMs: number;
	exitCode: number | null;
	signal: string | null;
	timedOut: boolean;
	cancelledAt?: string;
	stdoutPath: string;
	stderrPath: string;
	requestLogPath: string;
	transcriptPath: string;
	stdoutSha256: string;
	stderrSha256: string;
	requestLogSha256: string;
	transcriptSha256: string;
	request: {
		method?: string;
		path?: string;
		model?: string;
		stream?: boolean;
		authHeaderSha256?: string;
		bodySha256?: string;
	};
	failureId?: string;
	repairId?: string;
	assertions: {
		childProcessLaunched: boolean;
		requestSeen: boolean;
		endpointMatched: boolean;
		modelMatched: boolean;
		streamingUsed: boolean;
		successMarkerObserved: boolean;
		exitOkWhenExpected: boolean;
		exitFailedWhenExpected: boolean;
		timeoutCancelled: boolean;
		apiKeyEnvRefOnly: boolean;
		authorizationFromEnv: boolean;
		requestLogCaptured: boolean;
		transcriptCaptured: boolean;
		noLiteralSecrets: boolean;
		noPiHomeImport: boolean;
		noUpdateBanner: boolean;
		providerWorkerFailureRepairLinked?: boolean;
	};
	errors: string[];
};

export type { ParallelProviderWorkerMatrixV1 } from "./provider-parallel-matrix.ts";
