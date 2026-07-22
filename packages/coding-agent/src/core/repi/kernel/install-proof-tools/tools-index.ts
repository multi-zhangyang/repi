/** Register REPI tool_index/profile_check tools. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiIndexTools(registerTool: ToolRegistrar, pi: ExtensionAPI, deps: ProofLoopToolDeps): void {
	registerTool({
		name: "re_tool_index",
		label: "RE Tools",
		description: "Show or refresh the REPI tool index so tool paths are evidence-based instead of guessed.",
		promptSnippet: "Show or refresh reverse/pentest tool availability.",
		promptGuidelines: ["Do not guess security tool paths; use re_tool_index or REPI tool memory."],
		parameters: Type.Object({ action: Type.Union([Type.Literal("show"), Type.Literal("refresh")]) }),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const text = params.action === "refresh" ? await deps.refreshToolIndex(pi) : deps.buildToolDigest();
			deps.updateMissionCheckpoint("tool_index_checked", "done", params.action);
			return {
				content: [{ type: "text" as const, text: deps.truncateMiddle(text, 12000) }],
				details: { path: deps.toolIndexPath(), action: params.action },
			};
		},
	});
	registerTool({
		name: "re_profile_check",
		label: "RE Profile Check",
		description:
			"Run or show REPI profile checks for install readiness, regression guards, and reverse capability guards.",
		promptSnippet:
			"Use re_profile_check before installing/upgrading the profile or after major reverse/pentest capability changes.",
		promptGuidelines: [
			"Call re_profile_check full after profile edits and before claiming the agent is installable.",
			"Use install mode to verify install-repi/init wiring without touching global pi profile files.",
		],
		parameters: Type.Object({
			action: Type.Optional(
				Type.Union([Type.Literal("quick"), Type.Literal("full"), Type.Literal("install"), Type.Literal("show")]),
			),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "quick";
			const text = deps.buildProfileCheckOutput(action);
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestProfileCheckArtifactPath() } as Record<string, unknown>,
			};
		},
	});
}
