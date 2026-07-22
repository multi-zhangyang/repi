/** Worker-runtime provider failure injection report type. */
export type RepiProviderFailureInjectionReportV1 = {
	kind: "ProviderFailureInjectionReportV1";
	schemaVersion: 1;
	generatedAt: string;
	isolatedHome: string;
	workspace: string;
	cases: Array<{
		kind: "ProviderFailureInjectionCaseV1";
		schemaVersion: 1;
		caseId: string;
		providerName: string;
		api: "openai-completions" | "anthropic-messages";
		modelId: string;
		failureMode: "http_500" | "malformed_sse" | "anthropic_error_event" | "timeout" | "connection_reset";
		status: "pass" | "blocked";
		exitCode: number | null;
		signal: string | null;
		request: {
			method?: string;
			path?: string;
			model?: string;
			stream?: boolean;
			bodySha256?: string;
		};
		stdoutSha256: string;
		stderrSha256: string;
		requestLogSha256: string;
		transcriptSha256: string;
		failureId: string;
		repairId: string;
		assertions: {
			requestSeen: boolean;
			exitNonZero: boolean;
			failureTextCaptured: boolean;
			failureRepairLinked: boolean;
			noLiteralSecrets: boolean;
			noPiHomeImport: boolean;
			noUpdateBanner: boolean;
		};
	}>;
	failureLedgerEvents: Array<{
		id: string;
		status: string;
		retryBudget: { remainingAttempts: number };
	}>;
	repairQueue: Array<{
		repairId: string;
		fromFailureId: string;
		action: string;
		paused: boolean;
	}>;
	failureRepairValidation: {
		ok: boolean;
		failureCount: number;
		repairCount: number;
	};
	writebackProbe: {
		status: "pass" | "blocked";
		validation: { ok: boolean };
	};
};
