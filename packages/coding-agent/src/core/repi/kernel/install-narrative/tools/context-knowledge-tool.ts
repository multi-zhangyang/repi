/** Narrative tool: re_knowledge_graph. */
import { Type } from "typebox";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerRepiKnowledgeGraphTool(registerTool: ToolRegistrar, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_knowledge_graph",
		label: "RE Knowledge Graph",
		description:
			"Build, show, or query a REPI long-term knowledge graph from map/browser/run/operation/verifier/compiler/replayer/autofix artifacts for cross-task reuse.",
		promptSnippet:
			"Use re_knowledge_graph after autofix/replay/report stages to consolidate artifacts into reusable case signatures, worker routing hints, and command strategies.",
		promptGuidelines: [
			"Call re_knowledge_graph build after re_autofix or before final completion to persist cross-artifact knowledge.",
			"Use query to retrieve similar artifact tags, worker routing hints, and command strategy hints.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("build"), Type.Literal("show"), Type.Literal("query")])),
			query: Type.Optional(Type.String()),
			target: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "build";
			const text = deps.buildKnowledgeGraphOutput(action, { query: params.query, target: params.target });
			const path =
				/^knowledge_artifact:\s*(.+)$/m.exec(text)?.[1]?.trim() ??
				deps.latestKnowledgeGraphArtifactPath({ target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path, query: params.query } as Record<string, unknown>,
			};
		},
	});
}
