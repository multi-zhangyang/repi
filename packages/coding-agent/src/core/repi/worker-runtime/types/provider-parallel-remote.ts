/** Worker-runtime remote/resume types. */
export type RepiCrossSessionResumeLiveV1 = {
	kind: "CrossSessionResumeLiveV1";
	isolatedHome: string;
	pack: { contextPath: string };
	resume: {
		resumedFromContextPath: string;
		resumeQueueStatus: string;
		closureStatus: string;
		exactResumeVerification: {
			loadedBy: string;
			contextSha256: string;
			artifactHashes: string;
			scope: string;
		};
	};
	compactResumeLedger: { currentState: string; invalidTransitions: unknown[]; statePath: string[] };
	providerContinuation: { status: "pass" | "blocked" };
	workerContinuation: { status: "pass" | "blocked" };
	assertions: {
		crossSessionDifferent: boolean;
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
};
