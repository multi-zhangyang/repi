/** Wire-reverse: configureKnowledgeGraph bag. */

import { latestScopedMarkdownArtifact } from "../artifact-scope-filter.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import { latestWorkerScoreboard } from "../delegate/pure.ts";
import { failureSignaturePriorityReport } from "../failure-repair/report.ts";
import { configureKnowledgeGraph } from "../knowledge-graph/deps.ts";
import { knowledgeCaseMemoryCandidates } from "../memory-candidates/candidates.ts";
import { buildMemoryScopeIsolationReport, readMemoryEvents } from "../memory-stubs.ts";
import { autonomousExecutionBudget } from "../operator-runtime/dispatch/budget.ts";
import { latestDispatcherFeedbackBoard } from "../operator-runtime/dispatch/feedback-board.ts";
import { appendEvidence } from "../runtime-adapter-exec-deps.ts";
import { sanitizeTargetForCommand } from "../target.ts";
import type { PickFn } from "./wire-pick.ts";

export function wireKnowledgeGraphConfigure(pick: PickFn): void {
	configureKnowledgeGraph({
		appendEvidence: pick("appendEvidence", appendEvidence),
		updateMissionCheckpoint: pick("updateMissionCheckpoint", updateMissionCheckpoint),
		latestScopedMarkdownArtifact: pick("latestScopedMarkdownArtifact", latestScopedMarkdownArtifact),
		autonomousExecutionBudget: pick("autonomousExecutionBudget", autonomousExecutionBudget),
		failureSignaturePriorityReport: pick("failureSignaturePriorityReport", failureSignaturePriorityReport),
		latestDispatcherFeedbackBoard: pick("latestDispatcherFeedbackBoard", latestDispatcherFeedbackBoard),
		latestWorkerScoreboard: pick("latestWorkerScoreboard", latestWorkerScoreboard),
		readMemoryEvents: pick("readMemoryEvents", readMemoryEvents),
		buildMemoryScopeIsolationReport: pick("buildMemoryScopeIsolationReport", buildMemoryScopeIsolationReport),
		knowledgeCaseMemoryCandidates: pick("knowledgeCaseMemoryCandidates", knowledgeCaseMemoryCandidates),
		sanitizeTargetForCommand: pick("sanitizeTargetForCommand", sanitizeTargetForCommand),
	});
}
