/** Cold-start packet input type. */
export type RepiColdStartInput = {
	route: any;
	mission: { id: string };
	prompt: string;
	stats: any;
	formatRoute: (route: any) => string;
	techniqueIdsForRoute: (route: any) => string[];
	buildMissionDigest: () => string;
	buildKernelOutput: (mode: string, opts: any) => string;
	buildDecisionCoreOutput: (mode: string, opts: any) => string;
	buildStartupEvidenceDigest: (opts: any) => string;
	buildStartupContextDigest: (opts: any) => string;
	buildToolDigest: () => string;
	truncateMiddle: (text: string, n: number) => string;
	formatCompletionAudit: () => string;
	makeSelfReview: (stats: any) => string;
};
