/** Register REPI re_verifier tool. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiVerifierTool(
	registerTool: ToolRegistrar,
	_pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	registerTool({
		name: "re_verifier",
		label: "RE Verifier",
		description:
			"Build, show, or matrix-check REPI evidence assertions and counter-evidence from operator execution artifacts.",
		promptSnippet:
			"Use re_verifier after re_operator dispatch/verify to convert execution output into assertions, evidence bindings, counter-evidence, and next verifier actions.",
		promptGuidelines: [
			"Call re_verifier check after operator dispatch before claiming a result.",
			"Use contradictions and gaps to drive re_operator escalate or another bounded dispatch.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("check"), Type.Literal("show"), Type.Literal("matrix")])),
			target: Type.Optional(Type.String()),
			technique: Type.Optional(
				Type.String({
					description:
						"Catalogued technique id (e.g. pwn-tcache-poisoning) to bind a falsifiable proof-contract from its proofExit.",
				}),
			),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "check";
			const text = deps.buildVerifierOutput(action, { target: params.target, techniqueId: params.technique });
			return {
				content: [{ type: "text" as const, text }],
				details: {
					action,
					path: deps.latestVerifierArtifactPath(),
					target: params.target,
					technique: params.technique,
				} as Record<string, unknown>,
			};
		},
	});
}
