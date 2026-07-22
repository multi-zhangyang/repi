/** Domain proof-exit corpus/closure builders and formatters. */
export {
	proofExitExpectedEvidence,
	proofExitRegexes,
	toolchainDomainIdForRoute,
} from "./matchers.ts";
export { domainProofExitNextCommands } from "./next-commands.ts";
export { assembleDomainProofExitCorpus } from "./pure-assemble.ts";
export { buildDomainProofExitClosureFromParts } from "./pure-closure.ts";
export {
	formatCampaign,
	formatDomainProofExitClosure,
} from "./pure-format.ts";
