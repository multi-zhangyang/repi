/** Narrative tools group: context. */
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";
import { registerRepiChallengeTool } from "./context-challenge-tool.ts";
import { registerRepiKnowledgeGraphTool } from "./context-knowledge-tool.ts";
import { registerRepiNoteTool } from "./context-note-tool.ts";
import { registerRepiContextPackTool } from "./context-pack-tool.ts";
import { registerRepiSpecialistPackTool } from "./context-specialist-tool.ts";

export function registerRepiNarrativeContextTools(registerTool: ToolRegistrar, deps: NarrativeToolDeps): void {
	registerRepiContextPackTool(registerTool, deps);
	registerRepiKnowledgeGraphTool(registerTool, deps);
	registerRepiSpecialistPackTool(registerTool, deps);
	registerRepiNoteTool(registerTool, deps);
	registerRepiChallengeTool(registerTool, deps);
}
