/**
 * Reverse runtime I/O builders/runners (browser/authz/exploit/mobile/native).
 * Domain implementations live under ./reverse-io/*.
 */

export {
	buildWebAuthzStateArtifact,
	buildWebAuthzStateOutput,
	inferWebAuthzUrl,
	latestWebAuthzStateArtifactPath,
	runWebAuthzState,
	writeWebAuthzStateArtifact,
} from "./reverse-io/authz.ts";
export {
	buildLiveBrowserArtifact,
	buildLiveBrowserOutput,
	inferBrowserUrl,
	latestLiveBrowserArtifactPath,
	runLiveBrowser,
	writeLiveBrowserArtifact,
} from "./reverse-io/browser.ts";
export {
	buildExploitLabArtifact,
	buildExploitLabOutput,
	inferExploitLabTarget,
	latestExploitLabArtifactPath,
	runExploitLab,
	writeExploitLabArtifact,
} from "./reverse-io/exploit.ts";
export {
	buildJsSigningArtifact,
	buildJsSigningOutput,
	latestJsSigningArtifactPath,
	runJsSigning,
	writeJsSigningArtifact,
} from "./reverse-io/js-signing.ts";
export {
	buildMobileRuntimeArtifact,
	buildMobileRuntimeOutput,
	inferMobilePackageName,
	latestMobileRuntimeArtifactPath,
	runMobileRuntime,
	writeMobileRuntimeArtifact,
} from "./reverse-io/mobile.ts";
export {
	buildNativeRuntimeArtifact,
	buildNativeRuntimeOutput,
	inferNativeRuntimeTarget,
	latestNativeRuntimeArtifactPath,
	runNativeRuntime,
	writeNativeRuntimeArtifact,
} from "./reverse-io/native.ts";
export type { ReverseIoDeps } from "./reverse-io/shared.ts";
export {
	appendReverseRuntimeEvidence,
	applyReverseStructuredSummary,
	configureReverseIo,
	replayHash,
	reverseEvidenceLedgerFields,
} from "./reverse-io/shared.ts";
