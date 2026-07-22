/** Narrative tools group: swarm. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";
import { registerRepiNarrativeSubagentTool } from "./swarm-run-subagent.ts";
export function registerRepiNarrativeSwarmRunTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	registerTool({
		name: "re_swarm",
		label: "RE Swarm",
		description:
			"Build, show, run, or merge multi-specialist swarm runtime packets from delegation worker_packets, emitting ReconParallelPlanV1, planCoverage, releaseCheckMetadata, bounded worker executions, parallel groups, merge protocol, collision matrix, and commander next actions. Release blocked until runtime capture proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true",
		promptSnippet:
			"Use re_swarm after re_delegate to organize specialist work as ReconParallelPlanV1-backed worker runtime packets with merge contracts and release-check metadata.",
		promptGuidelines: [
			"Call re_swarm plan after re_delegate plan/merge before broad multi-lane expansion.",
			"Use worker_runtime_packets plus parallel_plan.workers as exact sub-agent handoff contracts with evidence requirements, artifactGlobs, limits, and merge keys.",
		],
		parameters: Type.Object({
			action: Type.Optional(
				Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("run"), Type.Literal("merge")]),
			),
			target: Type.Optional(Type.String()),
			task: Type.Optional(Type.String()),
			maxWorkers: Type.Optional(Type.Number()),
			maxCommands: Type.Optional(Type.Number()),
			execution: Type.Optional(Type.Union([Type.Literal("simulated"), Type.Literal("real")])),
		}),
		async execute(_toolCallId, params: any, _signal, _onUpdate, ctx) {
			const action = params.action ?? "plan";
			const text =
				action === "run"
					? await deps.runSwarm(pi, {
							target: params.target,
							task: params.task,
							maxWorkers: params.maxWorkers,
							maxCommands: params.maxCommands,
							execution: params.execution,
							cwd: ctx?.cwd,
						})
					: deps.buildSwarmOutput(action, { target: params.target, task: params.task });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestSwarmArtifactPath(), target: params.target } as Record<string, unknown>,
			};
		},
	});
	registerRepiNarrativeSubagentTool(registerTool, pi, deps);
}
