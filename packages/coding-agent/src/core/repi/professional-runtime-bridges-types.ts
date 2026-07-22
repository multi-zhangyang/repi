/**
 * Professional runtime bridge types.
 */

export type ProfessionalRuntimeBridgeStatus = "runtime-ready" | "blocked";

export type ProfessionalRuntimeBridgeSpec = {
	id: string;
	title: string;
	domains: string[];
	preferredTools: string[];
	fallbackTools: string[];
	commandTemplates: string[];
	artifactPlan: string[];
	envRefs: string[];
	proofExit: string[];
};

export type ProfessionalRuntimeBridgeRowV1 = {
	bridgeId: string;
	title: string;
	status: ProfessionalRuntimeBridgeStatus;
	domains: string[];
	preferredTools: string[];
	fallbackTools: string[];
	presentPreferred: string[];
	presentFallbacks: string[];
	missingPreferred: string[];
	fallback_available: boolean;
	commandTemplates: string[];
	artifactPlan: string[];
	artifactPlanOk: boolean;
	envRefs: string[];
	envRefOnly: boolean;
	proofExit: string[];
	proofExitFound: string[];
	proofExitMissing: string[];
	executableTemplateCount: number;
	narrativeOnly: boolean;
	nextRuntimeCommands: string[];
};

export type ProfessionalRuntimeBridgesCheckV1 = {
	kind: "ProfessionalRuntimeBridgesCheckV1";
	schemaVersion: 1;
	generatedAt: string;
	ProfessionalRuntimeBridgesCheckV1: true;
	runtime: "runtime:professional-runtime-bridges";
	toolIndexPath: string;
	requiredChecks: string[];
	bridges: ProfessionalRuntimeBridgeRowV1[];
	closure: {
		allBridgeSpecsPresent: boolean;
		allFallbacksAvailable: boolean;
		allHaveExecutableTemplates: boolean;
		allHaveArtifactPlans: boolean;
		allHaveProofExitMappings: boolean;
		allEnvRefsSecretFree: boolean;
	};
	nextRuntimeCommands: string[];
	invariants: string[];
};
