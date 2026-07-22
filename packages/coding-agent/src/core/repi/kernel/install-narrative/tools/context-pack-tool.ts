/** Narrative tool: re_context. */
import { Type } from "typebox";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerRepiContextPackTool(registerTool: ToolRegistrar, deps: NarrativeToolDeps): void {
	registerTool({
		name: "re_context",
		label: "RE Context",
		description:
			"Pack, show, or exact-resume REPI mission context across compaction/restart with artifact hashes, repair queue, reflection rules, and next commands.",
		promptSnippet:
			"Use re_context before compaction, handoff, or after re_reflect to preserve/resume the active operation.",
		promptGuidelines: [
			"Call re_context pack after re_reflect write or before long-context compaction.",
			"Call re_context resume with contextPath or compactionEntryId at the start of a continued mission to recover next_operator_commands from the exact pack.",
		],
		parameters: Type.Object({
			action: Type.Optional(
				Type.Union([
					Type.Literal("pack"),
					Type.Literal("show"),
					Type.Literal("resume"),
					Type.Literal("resume-ledger"),
				]),
			),
			target: Type.Optional(Type.String()),
			contextPath: Type.Optional(Type.String()),
			compactionEntryId: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "pack";
			const contextRef = params.contextPath ?? params.compactionEntryId;
			const text = deps.buildContextOutput(action, { target: params.target, contextRef });
			const contextPath =
				/^context_artifact:\s*(.+)$/m.exec(text)?.[1]?.trim() ??
				deps.latestContextPackArtifactPath({ target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: {
					action,
					path: contextPath,
					target: params.target,
					contextPath: params.contextPath,
					compactionEntryId: params.compactionEntryId,
				} as Record<string, unknown>,
			};
		},
	});
}
