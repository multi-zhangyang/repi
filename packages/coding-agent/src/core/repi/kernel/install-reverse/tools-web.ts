/** Reverse install tools: browser / authz / js-signing. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { truncateMiddle } from "../../text.ts";
import { softMarkReverseFromNative } from "./tools-native-ready.ts";
import { registerRepiReverseLiveBrowserTool } from "./tools-web-browser.ts";
import { registerRepiReverseJsSigningTool } from "./tools-web-js.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiReverseWebTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerRepiReverseLiveBrowserTool(registerTool, pi, deps);
	registerTool({
		name: "re_web_authz_state",
		label: "RE Web Authz State",
		description:
			"Plan, show, or run Web/API authorization state capture with principal matrix, object ownership probes, sequence replay, rollback checks, and artifact JSON.",
		promptSnippet:
			"Use re_web_authz_state for Web/API authorization, IDOR, BOLA, JWT/session, object ownership, and state-machine claims after re_live_browser or re_map.",
		promptGuidelines: [
			"Call re_web_authz_state run for Web/API targets to define principal, object, sequence, and rollback evidence contracts.",
			"Call re_web_authz_state run with COOKIE_A/COOKIE_B or AUTH_A/AUTH_B to capture principal status/body-hash matrix and object ownership anchors.",
		],
		parameters: Type.Object(
			{
				action: Type.Optional(Type.String()),
				target: Type.Optional(Type.String()),
				url: Type.Optional(Type.String()),
				timeoutMs: Type.Optional(Type.Number()),
			},
			{ additionalProperties: true },
		),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const hasHttpTarget = /^https?:\/\//i.test(String(params.url || params.target || "").trim());
			const rawAction = String(params.action ?? (hasHttpTarget ? "run" : "plan")).toLowerCase();
			const action =
				rawAction === "run" || rawAction === "capture"
					? "run"
					: rawAction === "show"
						? "show"
						: rawAction === "plan"
							? "plan"
							: hasHttpTarget
								? "run"
								: "plan";
			const text =
				action === "run"
					? await deps.runWebAuthzState(pi, {
							target: params.target,
							url: params.url,
							timeoutMs: params.timeoutMs,
						})
					: deps.buildWebAuthzStateOutput(action, {
							target: params.target,
							url: params.url,
							timeoutMs: params.timeoutMs,
						});
			const path = deps.latestWebAuthzStateArtifactPath();
			if (action === "run" && path) {
				softMarkReverseFromNative(String(path));
			}
			return {
				content: [{ type: "text" as const, text: truncateMiddle(text, 20000) }],
				details: {
					action,
					path,
					target: params.target,
					url: params.url,
				} as Record<string, unknown>,
			};
		},
	});
	// Landmark: re_js_signing registration (body in tools-web-js.ts)
	registerRepiReverseJsSigningTool(registerTool, pi, deps);
}
