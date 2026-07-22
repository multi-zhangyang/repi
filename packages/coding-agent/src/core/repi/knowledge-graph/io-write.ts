/** Knowledge-graph write artifact. */
import { join } from "node:path";
import { formatKnowledgeGraph } from "../knowledge-format.ts";
import { memoryPath, writeDispatcherPromotionPlaybook } from "../memory-stubs.ts";
import { ensureReconStorage } from "../resources.ts";
import { evidenceKnowledgeDir, writePrivateTextFile } from "../storage.ts";
import { slug } from "../text.ts";
import { appendEvidence, updateMissionCheckpoint } from "./deps.ts";
import { buildKnowledgeGraphIndexMarkdown } from "./io-write-index.ts";
import { withKnowledgeGraphReverseNext } from "./io-write-reverse.ts";
import type { KnowledgeGraphArtifact } from "./types.ts";

export function writeKnowledgeGraphArtifact(graph: KnowledgeGraphArtifact): string {
	ensureReconStorage();
	const path = join(
		evidenceKnowledgeDir(),
		`${graph.timestamp.replace(/[:.]/g, "-")}-${slug(graph.route ?? "knowledge")}-${graph.mode}.md`,
	);
	writePrivateTextFile(
		path,
		[
			"# REPI Knowledge Graph Artifact",
			"",
			formatKnowledgeGraph(graph, path),
			"",
			"## JSON",
			"",
			"```json",
			JSON.stringify(withKnowledgeGraphReverseNext(graph), null, 2),
			"```",
			"",
		].join("\n"),
	);
	writePrivateTextFile(memoryPath("knowledge-graph-index.md"), buildKnowledgeGraphIndexMarkdown(graph, path));
	writeDispatcherPromotionPlaybook({
		target: graph.target,
		timestamp: graph.timestamp,
		artifactPath: path,
		scoreboard: graph.dispatcherFeedbackScoreboard,
		learningHints: graph.dispatcherRoutingHints,
	});
	appendEvidence({
		kind: "artifact",
		title: `knowledge-graph-${graph.mode} ${graph.missionId ?? "no-mission"}`,
		fact: `Knowledge graph ${graph.mode}: nodes=${graph.nodes.length}, edges=${graph.edges.length}, signatures=${graph.caseSignatures.length}, scope_blocked=${graph.knowledgeScopeIsolation.blockedSourceCount}, scope_warn=${graph.knowledgeScopeIsolation.warnSourceCount}, adaptive_routes=${graph.adaptiveRoutingHints.length}, promotions=${graph.workerPromotionQueue.length}, dispatcher_feedback=${graph.dispatcherFeedbackScoreboard.length}, dispatcher_routes=${graph.dispatcherRoutingHints.length}, failure_signature_priority=${graph.failureSignaturePriority.length}, failure_signature_repairs=${graph.failureSignatureRepairQueue.length}, compact_resume_case_memory=${graph.compactResumeCaseMemory.length}, compact_resume_routes=${graph.compactResumeRoutingHints.length}, autonomous_budget=${graph.autonomousBudget?.maxTurns ?? "none"}/${graph.autonomousBudget?.maxDispatch ?? "none"}, score_decay=${(graph.dispatcherScoreDecay ?? []).length}, demotions=${(graph.repeatedFailureDemotions ?? []).length}, high_score_promotions=${(graph.highScorePromotions ?? []).length}`,
		command: `re_knowledge_graph ${graph.mode}`,
		path,
		verify: `cat ${path}`,
		confidence: "cross-artifact knowledge graph",
	});
	updateMissionCheckpoint("knowledge_graph_ready", "done", path);
	updateMissionCheckpoint("memory_or_evolution_written", "done", memoryPath("knowledge-graph-index.md"));
	return path;
}
