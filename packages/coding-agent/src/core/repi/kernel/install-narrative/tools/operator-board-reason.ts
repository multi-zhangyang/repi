/** Narrative operator tools group: board/reason. */
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";
import { registerOperatorTool } from "./operator-operator.ts";
import { registerReasonTool } from "./operator-reason.ts";

export function registerRepiNarrativeBoardReasonTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	registerOperatorTool(registerTool, pi, deps);
	registerReasonTool(registerTool, pi, deps);
}
