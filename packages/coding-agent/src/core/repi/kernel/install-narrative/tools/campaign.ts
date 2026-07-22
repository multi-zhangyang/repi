/** Narrative tools group: campaign. */
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";
import { registerAutopilotTool } from "./campaign-autopilot.ts";
import { registerCampaignTool } from "./campaign-campaign.ts";
import { registerExploitChainTool } from "./campaign-exploit-chain.ts";
import { registerOperationTool } from "./campaign-operation.ts";

export function registerRepiNarrativeCampaignTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
) {
	registerAutopilotTool(registerTool, pi, deps);
	registerExploitChainTool(registerTool, pi, deps);
	registerCampaignTool(registerTool, pi, deps);
	registerOperationTool(registerTool, pi, deps);
}
