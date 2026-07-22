/**
 * Verifier plan/write/show runtime.
 * Implementation under ./verifier-runtime/*.
 */

export {
	buildVerifier,
	buildVerifierOutput,
	formatVerifier,
	latestOrBuildVerifier,
	latestVerifierArtifactPath,
	parseVerifierArtifact,
	writeVerifierArtifact,
} from "./verifier-runtime/build.ts";
export { configureVerifierRuntime, d } from "./verifier-runtime/deps.ts";
export {
	artifactAssertions,
	checkAssertions,
	compilerOutcome,
	executionAssertion,
	verifierConfidence,
	verifierCounterEvidence,
	verifierInterestingEvidence,
	verifierStatusFromExecution,
	verifierTechniqueProofContract,
} from "./verifier-runtime/pure.ts";
export type { VerifierArtifact, VerifierRuntimeDeps } from "./verifier-runtime/types.ts";
