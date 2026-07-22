/** Knowledge-graph markdown body sections (non-reverse). */

import type { KnowledgeGraphFormatView } from "./knowledge-format-types.ts";
import { autonomousBudgetLines } from "./operator-format.ts";

export function knowledgeGraphBodySections(graph: KnowledgeGraphFormatView, path?: string): string[] {
	return [
		"knowledge_graph:",
		path ? `knowledge_artifact: ${path}` : undefined,
		`timestamp: ${graph.timestamp}`,
		`mode: ${graph.mode}`,
		`mission_id: ${graph.missionId ?? "none"}`,
		`route: ${graph.route ?? "none"}`,
		`target: ${graph.target ?? "<none>"}`,
		`query: ${graph.query ?? "<none>"}`,
		`nodes: ${graph.nodes.length}`,
		`edges: ${graph.edges.length}`,
		"case_signatures:",
		...(graph.caseSignatures.length ? graph.caseSignatures.map((item: any) => `- ${item}`) : ["- none"]),
		"knowledge_scope_isolation:",
		`- MemoryScopeIsolationV1=${graph.knowledgeScopeIsolation.MemoryScopeIsolationV1}`,
		`- scope_filter_by_mission_session_workspace_target=${graph.knowledgeScopeIsolation.scope_filter_by_mission_session_workspace_target}`,
		`- checked_sources=${graph.knowledgeScopeIsolation.checkedSourceCount}`,
		`- blocked_sources=${graph.knowledgeScopeIsolation.blockedSourceCount}`,
		`- warn_sources=${graph.knowledgeScopeIsolation.warnSourceCount}`,
		`- report=${graph.knowledgeScopeIsolation.reportPath}`,
		"scope_quarantined_artifacts:",
		...(graph.knowledgeScopeIsolation.quarantinedSourceArtifacts.length
			? graph.knowledgeScopeIsolation.quarantinedSourceArtifacts.map((item: any) => `- ${item}`)
			: ["- none"]),
		"artifact_nodes:",
		...graph.nodes
			.filter((node: any) => node.path)
			.sort((a: any, b: any) => b.score - a.score)
			.slice(0, 24)
			.map((node: any) => `- ${node.id} score=${node.score} tags=${node.tags.join(",")} path=${node.path}`),
		"high_value_edges:",
		...(graph.edges.length
			? graph.edges
					.slice(0, 32)
					.map((edge: any) => `- ${edge.from} -> ${edge.to} [${edge.kind}] ${edge.label ?? ""}`)
			: ["- none"]),
		"similarity_index:",
		...(graph.similarityIndex.length ? graph.similarityIndex.map((item: any) => `- ${item}`) : ["- none"]),
		"worker_routing_hints:",
		...(graph.workerRoutingHints.length ? graph.workerRoutingHints.map((item: any) => `- ${item}`) : ["- none"]),
		"worker_scoreboard:",
		...(graph.workerScoreboard?.length ? graph.workerScoreboard.map((item: any) => `- ${item}`) : ["- none"]),
		"adaptive_routing_hints:",
		...(graph.adaptiveRoutingHints?.length ? graph.adaptiveRoutingHints.map((item: any) => `- ${item}`) : ["- none"]),
		"worker_promotion_queue:",
		...(graph.workerPromotionQueue?.length ? graph.workerPromotionQueue.map((item: any) => `- ${item}`) : ["- none"]),
		"command_strategy_hints:",
		...(graph.commandStrategyHints.length ? graph.commandStrategyHints.map((item: any) => `- ${item}`) : ["- none"]),
		"dispatcher_feedback_scoreboard:",
		...(graph.dispatcherFeedbackScoreboard?.length
			? graph.dispatcherFeedbackScoreboard.map((item: any) => `- ${item}`)
			: ["- none"]),
		"dispatcher_routing_hints:",
		...(graph.dispatcherRoutingHints?.length
			? graph.dispatcherRoutingHints.map((item: any) => `- ${item}`)
			: ["- none"]),
		"failure_signature_priority:",
		...(graph.failureSignaturePriority?.length
			? graph.failureSignaturePriority.map((item: any) => `- ${item}`)
			: ["- none"]),
		"failure_signature_repair_queue:",
		...(graph.failureSignatureRepairQueue?.length
			? graph.failureSignatureRepairQueue.map((item: any) => `- ${item}`)
			: ["- none"]),
		"compact_resume_telemetry:",
		...(graph.compactResumeTelemetry?.length
			? graph.compactResumeTelemetry.map((item: any) => `- ${item}`)
			: ["- none"]),
		"compact_resume_case_memory:",
		...(graph.compactResumeCaseMemory?.length
			? graph.compactResumeCaseMemory.map((item: any) => `- ${item}`)
			: ["- none"]),
		"compact_resume_routing_hints:",
		...(graph.compactResumeRoutingHints?.length
			? graph.compactResumeRoutingHints.map((item: any) => `- ${item}`)
			: ["- none"]),
		"autonomous_execution_budget:",
		...autonomousBudgetLines(graph.autonomousBudget).map((item: any) => `- ${item}`),
		"dispatcher_score_decay:",
		...(graph.dispatcherScoreDecay?.length ? graph.dispatcherScoreDecay.map((item: any) => `- ${item}`) : ["- none"]),
		"repeated_failure_demotions:",
		...(graph.repeatedFailureDemotions?.length
			? graph.repeatedFailureDemotions.map((item: any) => `- ${item}`)
			: ["- none"]),
		"high_score_promotions:",
		...(graph.highScorePromotions?.length ? graph.highScorePromotions.map((item: any) => `- ${item}`) : ["- none"]),
		"knowledge_next_actions:",
		...(graph.nextActions.length ? graph.nextActions.map((item: any) => `- ${item}`) : ["- re_context pack"]),
		`next_knowledge_command: ${graph.mode === "query" ? "re_knowledge_graph build" : "re_knowledge_graph query <term>"}`,
		"source_artifacts:",
		...(graph.sourceArtifacts.length ? graph.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	].filter(Boolean) as string[];
}
