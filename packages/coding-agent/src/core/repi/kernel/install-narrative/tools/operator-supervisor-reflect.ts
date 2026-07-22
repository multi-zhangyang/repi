/** Narrative operator tools group. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../../extensions/types.ts";
import type { NarrativeToolDeps, ToolRegistrar } from "../types.ts";

export function registerRepiNarrativeSupervisorReflectTools(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	registerTool({
		name: "re_supervisor",
		label: "RE Supervisor",
		description:
			"Review, show, or repair REPI specialist worker packets using a supervisor critic over ReconParallelPlanV1, planCoverage, claimCheckPolicy, evidence, conflicts, checkpoints, and priority queues. reverse_claim_blocked until proof.exit=partial_runtime_capture|runtime_capture_strong",
		promptSnippet:
			"Use re_supervisor after re_swarm/re_delegate to score worker evidence, enforce planCoverage/claimCheckPolicy, find conflicts, and produce repair queues.",
		promptGuidelines: [
			"Call re_supervisor review before final claims or when worker packets, planCoverage, or claim checkpoints conflict.",
			"Use supervisor planCoverage, claimCheckPolicy, repair_queue, and priority_queue to choose the next re_swarm/re_operation or lane action.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("review"), Type.Literal("show"), Type.Literal("repair")])),
			target: Type.Optional(Type.String()),
			task: Type.Optional(Type.String()),
			reasoning: Type.Optional(Type.Union([Type.Literal("rules"), Type.Literal("llm")])),
		}),
		async execute(_toolCallId, params: any, _signal, _onUpdate, ctx) {
			const action = params.action ?? "review";
			const text = await deps.buildSupervisorOutput(action, {
				target: params.target,
				task: params.task,
				reasoning: params.reasoning,
				cwd: ctx?.cwd,
			});
			return {
				content: [{ type: "text" as const, text }],
				details: {
					action,
					path: deps.latestSupervisorArtifactPath(),
					target: params.target,
					reasoning: params.reasoning ?? "rules",
				} as Record<string, unknown>,
			};
		},
	});
	registerTool({
		name: "re_reflect",
		label: "RE Reflect",
		description:
			"Plan, show, or write REPI self-evolution memory from supervisor reviews, repair queues, and high-value worker lessons.",
		promptSnippet:
			"Use re_reflect after re_supervisor to turn critique into playbooks, field journal, and evolution memory.",
		promptGuidelines: [
			"Call re_reflect plan to inspect lessons/failure patterns before memory writes.",
			"Call re_reflect write after supervisor review/repair to persist reusable playbooks and evolution rules.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("write")])),
			target: Type.Optional(Type.String()),
			task: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text = deps.buildReflectOutput(action, { target: params.target, task: params.task });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestReflectionArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
