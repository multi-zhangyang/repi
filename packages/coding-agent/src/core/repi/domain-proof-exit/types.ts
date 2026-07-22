import type { ToolchainDomainStatus } from "../kernel/toolchain-domain-types.ts";
/** Domain proof-exit types. */
export type DomainProofExitClosureStatus = "passed" | "partial" | "blocked";

export type DomainProofExitRowV1 = {
	proofExit: string;
	status: "matched" | "missing";
	matchedArtifacts: string[];
	matchedLines: string[];
	expectedEvidence: string[];
	nextCommands: string[];
};

export type DomainProofExitClosureV1 = {
	kind: "DomainProofExitClosureV1";
	schemaVersion: 1;
	generatedAt: string;
	missionId?: string;
	routeDomain?: string;
	domainId?: string;
	status: DomainProofExitClosureStatus;
	toolchainStatus?: ToolchainDomainStatus;
	artifactCorpusHash: string;
	artifactSources: string[];
	rows: DomainProofExitRowV1[];
	matchedProofExits: string[];
	missingProofExits: string[];
	blockers: string[];
	nextRuntimeCommands: string[];
};

export type CampaignPhaseStatus = "ready" | "blocked" | "pending" | "done";

export type CampaignPhase = {
	name: string;
	objective: string;
	route: string;
	status: CampaignPhaseStatus;
	requiredEvidence: string[];
	candidateLanes: string[];
	nextActions: string[];
	toolGaps: string[];
	sourceArtifacts: string[];
};

export type CampaignArtifact = {
	timestamp: string;
	missionId?: string;
	route?: string;
	target?: string;
	phases: CampaignPhase[];
	pivots: string[];
	gaps: string[];
	toolGaps: string[];
	nextActions: string[];
	nextBootstrapCommand: string;
	sourceArtifacts: string[];
};

export type DomainProofExitCorpus = {
	sources: string[];
	text: string;
	hash: string;
};

export type DomainProofExitCapabilitySlice = {
	status?: import("../kernel/toolchain-domain-matrix.ts").ToolchainDomainStatus;
	missingRequired?: string[];
	proofExit: string[];
};
