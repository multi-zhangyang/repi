/** Knowledge-graph index markdown builder. */

import { autonomousBudgetLines } from "../operator-format-budget.ts";
import type { KnowledgeGraphArtifact } from "./types.ts";

export function buildKnowledgeGraphIndexMarkdown(graph: KnowledgeGraphArtifact, path: string): string {
	return [
		"# REPI Knowledge Graph Index",
		"",
		`Updated: ${graph.timestamp}`,
		`Artifact: ${path}`,
		"",
		"## Case signatures",
		...graph.caseSignatures.map((item: any) => `- ${item}`),
		"",
		"## Knowledge scope isolation",
		`- MemoryScopeIsolationV1=${graph.knowledgeScopeIsolation.MemoryScopeIsolationV1}`,
		`- scope_filter_by_mission_session_workspace_target=${graph.knowledgeScopeIsolation.scope_filter_by_mission_session_workspace_target}`,
		`- checked_sources=${graph.knowledgeScopeIsolation.checkedSourceCount}`,
		`- blocked_sources=${graph.knowledgeScopeIsolation.blockedSourceCount}`,
		`- warn_sources=${graph.knowledgeScopeIsolation.warnSourceCount}`,
		`- report=${graph.knowledgeScopeIsolation.reportPath}`,
		...(graph.knowledgeScopeIsolation.quarantinedSourceArtifacts.length
			? graph.knowledgeScopeIsolation.quarantinedSourceArtifacts.map((item: any) => `- quarantined=${item}`)
			: ["- quarantined=none"]),
		"",
		"## Similarity index",
		...graph.similarityIndex.map((item: any) => `- ${item}`),
		"",
		"## Worker routing hints",
		...graph.workerRoutingHints.map((item: any) => `- ${item}`),
		"",
		"## Worker scoreboard",
		...(graph.workerScoreboard?.length ? graph.workerScoreboard.map((item: any) => `- ${item}`) : ["- none"]),
		"",
		"## Adaptive routing hints",
		...(graph.adaptiveRoutingHints?.length ? graph.adaptiveRoutingHints.map((item: any) => `- ${item}`) : ["- none"]),
		"",
		"## Worker promotion queue",
		...(graph.workerPromotionQueue?.length ? graph.workerPromotionQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"",
		"## Dispatcher feedback scoreboard",
		...(graph.dispatcherFeedbackScoreboard?.length
			? graph.dispatcherFeedbackScoreboard.map((item: any) => `- ${item}`)
			: ["- none"]),
		"",
		"## Dispatcher routing hints",
		...(graph.dispatcherRoutingHints?.length
			? graph.dispatcherRoutingHints.map((item: any) => `- ${item}`)
			: ["- none"]),
		"",
		"## Failure signature priority",
		...(graph.failureSignaturePriority?.length
			? graph.failureSignaturePriority.map((item: any) => `- ${item}`)
			: ["- none"]),
		"",
		"## Failure signature repair queue",
		...(graph.failureSignatureRepairQueue?.length
			? graph.failureSignatureRepairQueue.map((item: any) => `- ${item}`)
			: ["- none"]),
		"",
		"## Compact resume telemetry",
		...(graph.compactResumeTelemetry?.length
			? graph.compactResumeTelemetry.map((item: any) => `- ${item}`)
			: ["- none"]),
		"",
		"## Compact resume case memory",
		...(graph.compactResumeCaseMemory?.length
			? graph.compactResumeCaseMemory.map((item: any) => `- ${item}`)
			: ["- none"]),
		"",
		"## Compact resume routing hints",
		...(graph.compactResumeRoutingHints?.length
			? graph.compactResumeRoutingHints.map((item: any) => `- ${item}`)
			: ["- none"]),
		"",
		"## Autonomous execution budget",
		...autonomousBudgetLines(graph.autonomousBudget).map((item: any) => `- ${item}`),
		"",
		"## Dispatcher score decay",
		...(graph.dispatcherScoreDecay?.length ? graph.dispatcherScoreDecay.map((item: any) => `- ${item}`) : ["- none"]),
		"",
		"## Repeated failure demotions",
		...(graph.repeatedFailureDemotions?.length
			? graph.repeatedFailureDemotions.map((item: any) => `- ${item}`)
			: ["- none"]),
		"",
		"## High-score promotions",
		...(graph.highScorePromotions?.length ? graph.highScorePromotions.map((item: any) => `- ${item}`) : ["- none"]),
		"",
	].join("\n");
}
