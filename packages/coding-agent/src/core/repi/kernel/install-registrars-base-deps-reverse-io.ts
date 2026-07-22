/** Install reverse-io / domain runtime deps. */

import {
	buildDomainProofExitClosure,
	buildDomainProofExitClosureOutput,
	formatDomainProofExitClosure,
} from "../domain-proof-exit.ts";
import {
	buildProfessionalRuntimeBridgesGate,
	formatProfessionalRuntimeBridgesGate,
	writeProfessionalRuntimeBridgesArtifact,
} from "../professional-runtime-bridges.ts";
import {
	buildExploitLabOutput,
	buildJsSigningOutput,
	buildLiveBrowserOutput,
	buildMobileRuntimeOutput,
	buildNativeRuntimeOutput,
	buildWebAuthzStateOutput,
	latestExploitLabArtifactPath,
	latestJsSigningArtifactPath,
	latestLiveBrowserArtifactPath,
	latestMobileRuntimeArtifactPath,
	latestNativeRuntimeArtifactPath,
	latestWebAuthzStateArtifactPath,
	runExploitLab,
	runJsSigning,
	runLiveBrowser,
	runMobileRuntime,
	runNativeRuntime,
	runWebAuthzState,
} from "../reverse-io.ts";

export const installBaseReverseIoDeps = {
	buildDomainProofExitClosure,
	buildDomainProofExitClosureOutput,
	formatDomainProofExitClosure,
	buildExploitLabOutput,
	buildJsSigningOutput,
	buildLiveBrowserOutput,
	buildMobileRuntimeOutput,
	buildNativeRuntimeOutput,
	buildWebAuthzStateOutput,
	latestExploitLabArtifactPath,
	latestJsSigningArtifactPath,
	latestLiveBrowserArtifactPath,
	latestMobileRuntimeArtifactPath,
	latestNativeRuntimeArtifactPath,
	latestWebAuthzStateArtifactPath,
	runExploitLab,
	runJsSigning,
	runLiveBrowser,
	runMobileRuntime,
	runNativeRuntime,
	runWebAuthzState,
	buildProfessionalRuntimeBridgesGate,
	formatProfessionalRuntimeBridgesGate,
	writeProfessionalRuntimeBridgesArtifact,
} as const;
