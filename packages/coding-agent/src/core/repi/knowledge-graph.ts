/**
 * Knowledge graph build/write/show from reverse/pentest artifacts.
 * Implementation under ./knowledge-graph/*.
 */

export { buildKnowledgeGraph } from "./knowledge-graph/build.ts";
export {
	configureKnowledgeGraph,
	deps,
} from "./knowledge-graph/deps.ts";
export {
	buildKnowledgeScopeIsolation,
	compactResumeKnowledgeSignals,
	knowledgeArtifactSources,
	knowledgeCommandHints,
	knowledgeScore,
	knowledgeTags,
	knowledgeWorkerHints,
} from "./knowledge-graph/helpers.ts";
export {
	buildKnowledgeGraphOutput,
	latestKnowledgeGraphArtifactPath,
	writeKnowledgeGraphArtifact,
} from "./knowledge-graph/io.ts";
export type {
	KnowledgeEdge,
	KnowledgeGraphArtifact,
	KnowledgeGraphDeps,
	KnowledgeNode,
} from "./knowledge-graph/types.ts";
