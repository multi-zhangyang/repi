/** Runtime types: cross-session resume live. */

export type CrossSessionResumeContinuationV1 = {
	status: "pass" | "blocked";
	exitCode: number | null;
	signal: string | null;
	elapsedMs: number;
	stdoutPath: string;
	stderrPath: string;
	stdoutSha256: string;
	stderrSha256: string;
	requestLogPath?: string;
	requestLogSha256?: string;
	request?: {
		method?: string;
		path?: string;
		model?: string;
		stream?: boolean;
		authHeaderSha256?: string;
		bodySha256?: string;
	};
	assertions: Record<string, boolean>;
};

export type CrossSessionResumeLiveV1 = {
	kind: "CrossSessionResumeLiveV1";
	schemaVersion: 1;
	generatedAt: string;
	isolatedHome: string;
	workspace: string;
	packSessionId: string;
	resumeSessionId: string;
	providerSessionId: string;
	workerSessionId: string;
	pack: {
		contextPath: string;
		contextSha256: string;
		sessionId: string;
		idempotencyKey: string;
		resumeQueueStatus: "queued" | "running" | "done" | "blocked" | "exhausted";
		closureStatus: "open" | "closed" | "blocked" | "exhausted";
		artifactHashCount: number;
	};
	resume: {
		contextPath: string;
		resumedFromContextPath: string;
		contextSha256: string;
		sessionId: string;
		resumeQueueStatus: "queued" | "running" | "done" | "blocked" | "exhausted";
		closureStatus: "open" | "closed" | "blocked" | "exhausted";
		exactResumeVerification: {
			loadedBy: "contextPath" | "compactionEntryId" | "latest" | "missing";
			contextSha256: "pass" | "drift" | "missing";
			artifactHashes: "pass" | "drift" | "missing";
			scope: "pass" | "mismatch" | "missing";
			blockedCount: number;
			warningsCount: number;
		};
	};
	compactResumeLedger: {
		transitionPath: string;
		reportPath: string;
		currentState: "queued" | "running" | "done" | "blocked" | "exhausted";
		invalidTransitions: string[];
		transitionCount: number;
		statePath: string[];
	};
	providerContinuation: CrossSessionResumeContinuationV1 & {
		providerName: string;
		modelId: string;
	};
	workerContinuation: CrossSessionResumeContinuationV1;
	artifacts: {
		path: string;
		sha256: string;
		bytes: number;
		mtime: string;
	}[];
	assertions: {
		crossSessionDifferent: boolean;
		isolatedRepiHome: boolean;
		packQueued: boolean;
		exactResumeLoadedByContextPath: boolean;
		resumedFromOriginalPack: boolean;
		contextSha256Pass: boolean;
		artifactHashesPass: boolean;
		scopePass: boolean;
		closureClosed: boolean;
		ledgerDone: boolean;
		providerContinuedAfterResume: boolean;
		workerContinuedAfterResume: boolean;
		envRefOnly: boolean;
		noPiHomeImport: boolean;
		noUpdateBanner: boolean;
		noLiteralSecrets: boolean;
	};
	errors: string[];
};
