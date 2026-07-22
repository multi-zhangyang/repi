/** Reverse install tool: re_js_signing. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { truncateMiddle } from "../../text.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiReverseJsSigningTool(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerTool({
		name: "re_js_signing",
		label: "RE JS Signing",
		description:
			"Plan, show, or run JS signing reverse capture: fetch/bundle inventory, crypto.subtle/hook signals, node rebuild scaffold, and proof-capture anchors.",
		promptSnippet:
			"Use re_js_signing for frontend JS reverse / request-signing rebuild after re_map or re_live_browser when signatures, nonces, crypto.subtle, or obfuscated clients appear.",
		promptGuidelines: [
			"Call re_js_signing run for HTTPS app shells or local bundles before claiming signature algorithm reconstruction.",
			"Call re_js_signing run with a concrete URL or JS path to capture hooks/crypto/sourcemap/rebuild artifacts and proof.exit.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("run")])),
			target: Type.Optional(Type.String()),
			url: Type.Optional(Type.String()),
			timeoutMs: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "plan";
			const text =
				action === "run"
					? await deps.runJsSigning(pi, { target: params.target, url: params.url, timeoutMs: params.timeoutMs })
					: deps.buildJsSigningOutput(action, {
							target: params.target,
							url: params.url,
							timeoutMs: params.timeoutMs,
						});
			return {
				content: [{ type: "text" as const, text: truncateMiddle(text, 20000) }],
				details: {
					action,
					path: deps.latestJsSigningArtifactPath(),
					target: params.target,
					url: params.url,
				} as Record<string, unknown>,
			};
		},
	});
}
