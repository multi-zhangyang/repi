/** Specialist lane command pack matrix types. */
export type ReLaneSpecialistDomainPackV1 = {
	domainId: string;
	routeMatchers: string[];
	laneSeeds: string[];
	commandPackMarkers: string[];
	analyzerAnchors: string[];
	selfHealCommands: string[];
	proofExitBridge: string[];
};

export type ReLaneSpecialistCommandPackCheckV1 = {
	kind: "ReLaneSpecialistCommandPackCheckV1";
	schemaVersion: 1;
	generatedAt: string;
	runtime: "runtime:re_lane-specialist-command-pack";
	domainCount: number;
	readyDomainCount: number;
	rows: Array<ReLaneSpecialistDomainPackV1 & { status: "ready" | "blocked"; gaps: string[] }>;
	closure: {
		allDomainsHaveRouteMatchers: boolean;
		allDomainsHaveLaneSeeds: boolean;
		allDomainsHaveCommandPacks: boolean;
		allDomainsHaveAnalyzerAnchors: boolean;
		allDomainsHaveSelfHeal: boolean;
		allDomainsHaveProofExitBridge: boolean;
	};
	nextRuntimeCommands: string[];
};
