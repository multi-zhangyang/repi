/**
 * Compaction resume telemetry and knowledge-signal packaging.
 * Implementation under ./compact-resume/*.
 */

export {
	configureCompactResume,
	d,
} from "./compact-resume/deps.ts";
export {
	buildReconCompactionAutoResume,
	buildReconCompactionDetails,
	buildReconCompactionResumeContract,
	buildReconCompactionSummary,
	compactResumeKnowledgeSignals,
	contextPathFromReconCompactionSummary,
	parseReconCompactionDetails,
	reconCompactionAutoResumePrompt,
	reconCompactionBullets,
	reconCompactionNextCommandsFromSummary,
	verifyContextPackResume,
} from "./compact-resume/signals.ts";
export {
	formatReconCompactionResumeTelemetry,
	initialReconCompactionResumeTelemetry,
	latestReconCompactionResumeTelemetry,
	missionCheckStatusLines,
	parseReconCompactionResumeTelemetry,
	reconCommandMatches,
	updateReconCompactionTelemetryFromExecutions,
	updateReconCompactionTelemetryFromOperator,
	writeReconCompactionResumeTelemetry,
} from "./compact-resume/telemetry.ts";
export type {
	CompactResumeDeps,
	ReconCompactionAutoResume,
	ReconCompactionDetails,
	ReconCompactionResumeContract,
	ReconCompactionResumeTelemetry,
} from "./compact-resume/types.ts";
