/** Reverse install tools: native / mobile / exploit. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { registerRepiReverseNativeTool } from "./tools-native-core.ts";
import { registerRepiReverseMobileTool } from "./tools-native-mobile.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiReverseNativeTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerTool({
		name: "re_exploit_lab",
		label: "RE Exploit Lab",
		description:
			"Plan, run, show, or bundle an exploit reliability lab with PoC inventory, environment pinning, replay matrix, flake triage, hashes, and bundle manifest.",
		promptSnippet:
			"Use re_exploit_lab for exploit/PoC/autopwn tasks before final claims to prove stability across bounded replay runs.",
		promptGuidelines: [
			"Call re_exploit_lab run with a concrete PoC path or REPI_EXPLOIT_CMD after inventory; prefer run for runtime proof capture.",
			"Capture success_rate, output hashes, and flake triage; then re_domain_proof_exit show / re_complete audit before claim.",
			"Feed exploit_lab_artifact into re_domain_proof_exit / re_complete audit and re_verifier, re_compiler, re_replayer, and re_knowledge_graph before final reporting.",
		],
		parameters: Type.Object({
			action: Type.Optional(
				Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("run"), Type.Literal("bundle")]),
			),
			target: Type.Optional(Type.String()),
			runs: Type.Optional(Type.Number()),
			timeoutMs: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const hasTarget = Boolean(String(params.target || params.url || "").trim());
			const action = params.action ?? (hasTarget ? "run" : "plan");
			const text =
				action === "run"
					? await deps.runExploitLab(pi, { target: params.target, runs: params.runs, timeoutMs: params.timeoutMs })
					: deps.buildExploitLabOutput(action, {
							target: params.target,
							runs: params.runs,
							timeoutMs: params.timeoutMs,
						});
			return {
				content: [{ type: "text" as const, text }],
				details: { action, path: deps.latestExploitLabArtifactPath(), target: params.target } as Record<
					string,
					unknown
				>,
			};
		},
	});
	// Landmark: re_mobile_runtime + re_native_runtime (bodies in tools-native-mobile/core.ts)
	registerRepiReverseMobileTool(registerTool, pi, deps);
	registerRepiReverseNativeTool(registerTool, pi, deps);
}
