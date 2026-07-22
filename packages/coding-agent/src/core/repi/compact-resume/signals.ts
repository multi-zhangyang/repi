/**
 * Compaction knowledge signals, verify, summary, auto-resume.
 * Implementation under ./signals/*.
 */
export { compactResumeKnowledgeSignals } from "./signals/knowledge.ts";
export {
	reconCompactionAutoResumePrompt,
	verifyContextPackResume,
} from "./signals/resume.ts";
export {
	buildReconCompactionAutoResume,
	buildReconCompactionDetails,
	buildReconCompactionResumeContract,
	buildReconCompactionSummary,
	contextPathFromReconCompactionSummary,
	parseReconCompactionDetails,
	reconCompactionBullets,
	reconCompactionNextCommandsFromSummary,
} from "./signals/summary.ts";
