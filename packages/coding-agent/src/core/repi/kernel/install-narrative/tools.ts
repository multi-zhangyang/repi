/** Narrative surface tool registrations (lean-gated control plane). */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiNarrativeCampaignTools } from "./tools/campaign.ts";
import { registerRepiNarrativeContextTools } from "./tools/context.ts";
import { registerRepiNarrativeOperatorTools } from "./tools/operator.ts";
import { registerRepiNarrativeSwarmTools } from "./tools/swarm.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "./types.ts";

export type { CommandRegistrar, NarrativeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiNarrativeTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	registerRepiNarrativeCampaignTools(registerTool, pi, deps);
	registerRepiNarrativeSwarmTools(registerTool, pi, deps);
	registerRepiNarrativeOperatorTools(registerTool, pi, deps);
	registerRepiNarrativeContextTools(registerTool, deps);
}
