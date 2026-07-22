/** Narrative tools group: re_subagent. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerRepiNarrativeSubagentTool(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	registerTool({
		name: "re_subagent",
		label: "RE Subagent",
		description:
			"Spawn a process-isolated REPI specialist subagent (explorer/planner/operator/verifier/reverser) for a bounded sub-task and return its handoff as evidence candidates.",
		promptSnippet:
			"Delegate bounded sub-tasks to a process-isolated REPI specialist subagent instead of doing everything inline.",
		promptGuidelines: [
			"Spawn verifier to independently challenge a claim or rerun a minimal repro.",
			"Spawn reverser for binary/mobile/firmware/PCAP/DFIR reverse-engineering evidence.",
		],
		parameters: Type.Object({
			spec: Type.Union([
				Type.Literal("explorer"),
				Type.Literal("planner"),
				Type.Literal("operator"),
				Type.Literal("verifier"),
				Type.Literal("reverser"),
			]),
			task: Type.String(),
			timeoutMs: Type.Optional(Type.Number()),
			additionalPrompt: Type.Optional(Type.String()),
			inheritMcp: Type.Optional(Type.Boolean()),
			mcpServers: Type.Optional(Type.Array(Type.String())),
			mcpTools: Type.Optional(Type.Array(Type.String())),
		}),
		executionMode: "parallel",
		async execute(_toolCallId, params: any, _signal, _onUpdate, ctx) {
			const timeoutMs = Math.min(600000, Math.max(1000, params.timeoutMs ?? 600000));
			const mgr = deps.createAgentThreadManager({ cwd: ctx.cwd });
			try {
				const started = await mgr.spawnThread({
					specName: params.spec,
					task: params.task,
					additionalPrompt: params.additionalPrompt,
					timeoutMs,
					inheritMcp: params.inheritMcp ?? true,
					mcpServers: params.mcpServers,
					mcpTools: params.mcpTools,
				});
				const final = await mgr.awaitRun(started.runId);
				const merge = mgr.mergeRun(started.runId);
				const mergeText = merge?.text ?? "(no merge output)";
				const summary = [
					`re_subagent: spec=${final.specName} status=${final.status} exitCode=${final.exitCode ?? "n/a"}`,
					`run_id: ${final.runId}`,
					`run_root: ${final.runRoot}`,
				].join("\n");
				return {
					content: [{ type: "text" as const, text: `${summary}\n\n${mergeText}` }],
					details: {
						runId: final.runId,
						spec: final.specName,
						status: final.status,
						exitCode: final.exitCode,
					} as Record<string, unknown>,
				};
			} catch (error) {
				return {
					content: [
						{ type: "text" as const, text: `re_subagent blocked: ${String((error as Error).message ?? error)}` },
					],
					details: { error: true } as Record<string, unknown>,
				};
			}
		},
	});
}
