/** Worker-runtime provider matrix/failure types. */
export type { RepiProviderFailureInjectionReportV1 } from "./provider-matrix-failure.ts";
export type RepiProviderRuntimeMatrixCaseV1 = {
	kind: "ProviderRuntimeMatrixCaseV1";
	schemaVersion: 1;
	caseId: string;
	providerName: string;
	api: "openai-completions" | "openai-responses" | "anthropic-messages";
	modelId: string;
	expectedPath: "/v1/chat/completions" | "/v1/responses" | "/v1/messages";
	diagnostic?: string;
	authHeader: "authorization" | "x-api-key";
	status: "pass" | "blocked";
	exitCode: number | null;
	signal: string | null;
	elapsedMs: number;
	stdoutPath: string;
	stderrPath: string;
	stdoutSha256: string;
	stderrSha256: string;
	request: {
		method?: string;
		path?: string;
		model?: string;
		stream?: boolean;
		authHeaderSha256?: string;
		bodySha256?: string;
	};
	assertions: {
		exitOk: boolean;
		requestSeen: boolean;
		modelMatched: boolean;
		streamingUsed: boolean;
		stdoutMarkerObserved: boolean;
		apiKeyEnvRefOnly: boolean;
		authorizationFromEnv: boolean;
		noPiHomeImport: boolean;
		noUpdateBanner: boolean;
		noLiteralSecrets: boolean;
		transcriptCaptured: boolean;
		requestLogCaptured: boolean;
	};
	errors: string[];
};
export type RepiProviderRuntimeMatrixV1 = {
	kind: "ProviderRuntimeMatrixV1";
	schemaVersion: 1;
	generatedAt: string;
	modelsJsonPath: string;
	requestLogPath: string;
	isolatedHome: string;
	workspace: string;
	listModels: {
		status: "pass" | "blocked";
		providers: string[];
		stdoutSha256: string;
		stderrSha256: string;
	};
	cases: RepiProviderRuntimeMatrixCaseV1[];
};
