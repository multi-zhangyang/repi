/** Evidence reverse/runtime path helpers. */
import { join } from "node:path";
import { reconDir } from "./core.ts";

export function evidenceLedgerPath(): string {
	return join(reconDir(), "evidence", "ledger.md");
}
export function evidenceRunsDir(): string {
	return join(reconDir(), "evidence", "runs");
}
export function evidenceMapsDir(): string {
	return join(reconDir(), "evidence", "maps");
}
export function evidenceBrowserDir(): string {
	return join(reconDir(), "evidence", "browser");
}
export function evidenceWebAuthzDir(): string {
	return join(reconDir(), "evidence", "web-authz");
}
export function evidenceJsSigningDir(): string {
	return join(reconDir(), "evidence", "js-signing");
}
export function evidenceExploitLabDir(): string {
	return join(reconDir(), "evidence", "exploit-lab");
}
export function evidenceMobileRuntimeDir(): string {
	return join(reconDir(), "evidence", "mobile-runtime");
}
export function evidenceNativeRuntimeDir(): string {
	return join(reconDir(), "evidence", "native-runtime");
}
export function evidenceGraphsDir(): string {
	return join(reconDir(), "evidence", "graphs");
}
export function evidenceChainsDir(): string {
	return join(reconDir(), "evidence", "chains");
}
export function evidenceFailuresDir(): string {
	return join(reconDir(), "evidence", "failures");
}
export function evidenceRepairsDir(): string {
	return join(reconDir(), "evidence", "repairs");
}
export function evidenceClaimReleaseDir(): string {
	return join(reconDir(), "evidence", "claim-release");
}
export function evidenceProofLoopsDir(): string {
	return join(reconDir(), "evidence", "proof-loops");
}
export function evidenceProfileCheckDir(): string {
	return join(reconDir(), "evidence", "profile-checks");
}
export function evidenceToolchainDir(): string {
	return join(reconDir(), "evidence", "toolchain");
}
