import type { FailureLedgerEventV1, RepairQueueItemV1 } from "../failure-repair/types.ts";

/** Runtime types: remote provider long-run. */

export type RemoteProviderLongRunCaseV1 = {
	kind: "RemoteProviderLongRunCaseV1";
	schemaVersion: 1;
	caseId: string;
	providerName: string;
	api: "openai-completions" | "openai-responses" | "anthropic-messages";
	modelIdSha256: string;
	attempt: number;
	status: "pass" | "blocked";
	exitCode: number | null;
	signal: string | null;
	timedOut: boolean;
	cancelledAt?: string;
	elapsedMs: number;
	timeoutMs: number;
	stdoutPath: string;
	stderrPath: string;
	transcriptPath: string;
	stdoutSha256: string;
	stderrSha256: string;
	transcriptSha256: string;
	failureId?: string;
	repairId?: string;
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
	errors: string[];
};

export type RemoteProviderLongRunV1 = {
	kind: "RemoteProviderLongRunV1";
	schemaVersion: 1;
	generatedAt: string;
	mode: "skipped" | "live";
	liveRequested: boolean;
	skipReason: string;
	configProblems: string[];
	providerName?: string;
	api?: "openai-completions" | "openai-responses" | "anthropic-messages";
	modelIdSha256?: string;
	baseUrlSha256?: string;
	apiKeyEnv?: string;
	attemptsPlanned: number;
	timeoutMs: number;
	listModels: {
		status: "pass" | "blocked" | "skipped";
		stdoutSha256: string;
		stderrSha256: string;
	};
	cases: RemoteProviderLongRunCaseV1[];
	failureLedgerEvents: FailureLedgerEventV1[];
	repairQueue: RepairQueueItemV1[];
	failureRepairValidation: {
		ok: boolean;
		failureCount: number;
		repairCount: number;
	};
	writebackProbe: {
		status: "pass" | "blocked" | "skipped";
		writeback: {
			failurePath: string;
			repairPath: string;
		} | null;
		validation: {
			ok: boolean;
			failureCount: number;
			repairCount: number;
		};
	};
};
