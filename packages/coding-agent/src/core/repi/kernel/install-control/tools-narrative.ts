/** Full-surface control-plane tools: re_kernel + re_decision_core. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ControlPlaneToolDeps } from "./tools-deps.ts";

type ToolRegistrar = (tool: Parameters<ExtensionAPI["registerTool"]>[0]) => void;

export function registerRepiControlNarrativeTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerTool({
		name: "re_kernel",
		label: "RE Kernel",
		description:
			"Build, show, or audit the REPI execution kernel: directive stack, refusal-to-execution rewrites, tool policy, artifact contract, and stall recovery.",
		promptSnippet:
			"Use re_kernel at reverse/pentest task start or after compaction to convert intent into execution-first directives and next operator actions.",
		promptGuidelines: [
			"Call re_kernel build before re_map on new reverse/pentest tasks when execution policy or next actions are unclear.",
			"Use refusal_to_execution_rules to turn missing target/tool/context into concrete re_map, re_lane, bootstrap, verifier, or autofix actions.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("build"), Type.Literal("show"), Type.Literal("audit")])),
			target: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "build";
			const text = deps.buildKernelOutput(action, { target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestKernelArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});

	registerTool({
		name: "re_decision_core",
		label: "RE Decision Core",
		description:
			"Plan, show, tick, or run the REPI decision core: objective stack, checkpoint pressure, evidence priority, tool/artifact posture, decision rules, and operator queue.",
		promptSnippet:
			"Use re_decision_core when the next reverse/pentest action is unclear or after kernel/context changes to select a concrete operator_next_command.",
		promptGuidelines: [
			"Call re_decision_core tick after re_kernel build, compaction resume, or any major artifact update.",
			"Use decision_rules and check_pressure to choose re_map, re_lane, re_chain, re_operator, verifier, compiler, replayer, autofix, or knowledge actions.",
			"Reverse-heavy routes prefer re_* run capture before narrative plan-only actions.",
		],
		parameters: Type.Object({
			action: Type.Optional(
				Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("tick"), Type.Literal("run")]),
			),
			target: Type.Optional(Type.String()),
			maxSteps: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text =
				action === "run"
					? await deps.runDecisionCore(pi, { target: params.target, maxSteps: params.maxSteps })
					: deps.buildDecisionCoreOutput(action, { target: params.target });
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestDecisionCoreArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
}
