/**
 * Profile integrity / reverse capability checks.
 * Implementation under ./profile-check/*.
 */

export {
	buildProfileCheckArtifact,
	buildProfileCheckOutput,
	formatProfileCheckArtifact,
	writeProfileCheckArtifact,
} from "./profile-check/build.ts";
export {
	findRepiRepoRoot,
	latestProfileCheckArtifactPath,
	profileCheckCriticalMarkers,
	profileCheckFileCheck,
	profileCheckInstalledFiles,
	profileCheckInstallScriptChecks,
	profileCheckMarkerChecks,
	profileCheckReverseCapabilityMarkers,
	profileCheckSourceCorpus,
	profileCheckSourceFiles,
	profileCheckVerdict,
	profileCheckWorkspacePath,
	profileCheckWritableDirCheck,
	repiRepoRoot,
} from "./profile-check/checks.ts";
export { configureProfileCheck, d } from "./profile-check/deps.ts";
export type {
	ProfileCheckArtifact,
	ProfileCheckDeps,
	ProfileCheckMode,
	ProfileCheckRow,
	ProfileCheckStatus,
} from "./profile-check/types.ts";
