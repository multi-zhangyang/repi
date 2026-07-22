/**
 * Toolchain domain capability types.
 */

export type ToolchainDomainStatus = "ready" | "degraded" | "blocked";

export type ToolchainDomainSpec = {
	id: string;
	label: string;
	requiredAny: string[];
	preferred: string[];
	fallbacks: string[];
	playbookMarkers: string[];
	commandScaffolds: string[];
	proofExit: string[];
};

export type ToolchainDomainCapabilityRowV1 = {
	domainId: string;
	label: string;
	status: ToolchainDomainStatus;
	requiredAny: string[];
	preferred: string[];
	fallbacks: string[];
	presentRequired: string[];
	presentPreferred: string[];
	presentFallbacks: string[];
	missingRequired: string[];
	missingPreferred: string[];
	fallback_available: boolean;
	critical_gap: boolean;
	playbookMarkersFound: string[];
	playbookMarkersMissing: string[];
	commandScaffoldsFound: string[];
	commandScaffoldsMissing: string[];
	proofExit: string[];
	recommendedInstallHints: string[];
	nextRuntimeCommands: string[];
};

export type ToolchainDomainCapabilityV1 = {
	kind: "ToolchainDomainCapabilityV1";
	schemaVersion: 1;
	generatedAt: string;
	runtime: "runtime:toolchain-doctor";
	discoveryMode: "tool-index";
	toolIndexPath: string;
	domains: ToolchainDomainCapabilityRowV1[];
	coverage: {
		domainCount: number;
		readyCount: number;
		degradedCount: number;
		blockedCount: number;
		readyOrDegradedCount: number;
		fallbackDomainCount: number;
	};
	toolchainClosure: {
		allDomainsHaveFallback: boolean;
		allDomainsHavePlaybookMarkers: boolean;
		allDomainsHaveCommandScaffolds: boolean;
		noCriticalGap: boolean;
	};
	nextActions: string[];
};
