/**
 * Domain proof-exit matching helpers and pure campaign formatters.
 * Implementation under ./domain-proof-exit/*.
 */

export {
	buildDomainProofExitClosure,
	buildDomainProofExitClosureOutput,
	configureDomainProofExit,
	domainProofExitArtifactCorpus,
} from "./domain-proof-exit/build.ts";
export {
	assembleDomainProofExitCorpus,
	buildDomainProofExitClosureFromParts,
	domainProofExitNextCommands,
	formatCampaign,
	formatDomainProofExitClosure,
	proofExitExpectedEvidence,
	proofExitRegexes,
	toolchainDomainIdForRoute,
} from "./domain-proof-exit/pure.ts";
export type {
	CampaignArtifact,
	CampaignPhase,
	CampaignPhaseStatus,
	DomainProofExitCapabilitySlice,
	DomainProofExitClosureStatus,
	DomainProofExitClosureV1,
	DomainProofExitCorpus,
	DomainProofExitRowV1,
} from "./domain-proof-exit/types.ts";
