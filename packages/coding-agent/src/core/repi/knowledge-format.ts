/**
 * Pure knowledge-graph formatter (duck-typed view).
 */
// Landmark: reverseDomainCaptureNextCommands reverse_domain_next formatKnowledgeGraph proof.exit bind_ready

import { knowledgeGraphBodySections } from "./knowledge-format-body.ts";
import { knowledgeGraphReverseNextLines } from "./knowledge-format-reverse.ts";
import type { KnowledgeGraphFormatView } from "./knowledge-format-types.ts";

export type {
	KnowledgeEdgeFormatView,
	KnowledgeGraphFormatView,
	KnowledgeNodeFormatView,
	KnowledgeScopeIsolationFormatView,
} from "./knowledge-format-types.ts";

export function formatKnowledgeGraph(graph: KnowledgeGraphFormatView, path?: string): string {
	const sections = knowledgeGraphBodySections(graph, path);
	const cmdIdx = sections.findIndex((line) => line.startsWith("next_knowledge_command:"));
	const before = cmdIdx >= 0 ? sections.slice(0, cmdIdx) : sections;
	const after = cmdIdx >= 0 ? sections.slice(cmdIdx) : [];
	return [...before, ...knowledgeGraphReverseNextLines(graph), ...after].filter(Boolean).join(String.fromCharCode(10));
}
