/**
 * Shared reverse I/O helpers: structured summary apply + runtime evidence append + DI deps.
 */
export type { ReverseIoDeps } from "./shared-deps.ts";
export {
	appendEvidence,
	configureReverseIo,
	deps,
	latestCompilerArtifactPath,
	latestContextPackArtifactPath,
	latestKernelArtifactPath,
	latestOperatorArtifactPath,
	latestReplayerArtifactPath,
	latestScopedMarkdownArtifact,
	latestVerifierArtifactPath,
	replayHash,
	updateMissionCheckpoint,
} from "./shared-deps.ts";
export {
	appendReverseRuntimeEvidence,
	applyReverseStructuredSummary,
	reverseEvidenceLedgerFields,
} from "./shared-evidence.ts";
