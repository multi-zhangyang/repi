/** Worker-runtime provider parallel/remote/resume types. */
export type { RepiCrossSessionResumeLiveV1 } from "./provider-parallel-remote.ts";
export type RepiParallelProviderWorkerMatrixV1 = {
	kind: "ParallelProviderWorkerMatrixV1";
	schemaVersion: 1;
	poolId: string;
	isolatedHome: string;
	maxConcurrency: number;
	peakConcurrency: number;
	listModels: { status: "pass" | "blocked" };
	workers: Array<{
		workerId: string;
		providerName: string;
		api: "openai-completions" | "anthropic-messages";
		modelId: string;
		mode: "pass" | "failure" | "timeout";
		status: "pass" | "repair_queued" | "cancelled" | "blocked";
		mergeKey: string;
		failureId?: string;
		repairId?: string;
		timedOut: boolean;
		cancelledAt?: string;
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
	}>;
	claimMerge: {
		strategy: string;
		claimAwareProviderWorkerMerge: boolean;
		conflicts: Array<{ mergeKey: string; status: "resolved" | "open"; winner?: string; evidenceRefs: string[] }>;
	};
	failureLedgerEvents: Array<{ status: string; retryBudget: { remainingAttempts: number } }>;
	repairQueue: Array<{ action: string; paused: boolean }>;
	failureRepairValidation: { ok: boolean };
	writebackProbe: { status: "pass" | "blocked"; validation: { ok: boolean } };
};
export type RepiRemoteProviderLongRunV1 = {
	kind: "RemoteProviderLongRunV1";
	mode: "skipped" | "live";
	skipReason: string;
	providerName?: string;
	api?: "openai-completions" | "openai-responses" | "anthropic-messages";
	modelIdSha256?: string;
	baseUrlSha256?: string;
	apiKeyEnv?: string;
	attemptsPlanned: number;
	listModels: { status: "pass" | "blocked" | "skipped" };
	cases: Array<{
		caseId: string;
		status: "pass" | "blocked";
		assertions: {
			exitOk: boolean;
			stdoutNonEmpty: boolean;
			markerObserved: boolean;
			apiKeyEnvRefOnly: boolean;
			boundedTimeout: boolean;
			isolatedRepiHome: boolean;
			noLiteralSecrets: boolean;
			noPiHomeImport: boolean;
			noUpdateBanner: boolean;
			transcriptCaptured: boolean;
		};
	}>;
	failureLedgerEvents: unknown[];
	repairQueue: unknown[];
	failureRepairValidation: { ok: boolean };
	writebackProbe: { status: "pass" | "blocked" | "skipped"; validation: { ok: boolean } };
};
