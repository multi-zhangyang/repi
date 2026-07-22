/** Reverse install tools: browser / authz / js-signing. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { truncateMiddle } from "../../text.ts";
import { registerRepiReverseJsSigningTool } from "./tools-web-js.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiReverseWebTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerTool({
		name: "re_live_browser",
		label: "RE Live Browser",
		description:
			"Plan, show, or run browser/XHR/WebSocket runtime capture with Playwright-if-installed and node-fetch fallback, producing auth matrix, IDOR/BOLA probes, replay commands, and runtime anchors.",
		promptSnippet:
			"Use re_live_browser for Web/API/JS reverse/pentest tasks after re_map to capture rendered requests, responses, storage, WebSockets, and replay probes.",
		promptGuidelines: [
			"Call re_live_browser run for HTTP(S) targets before claiming route/auth/session behavior.",
			"Call re_live_browser run with a concrete URL to capture request_response_log, runtime_anchors, storage, and WebSocket evidence.",
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
					? await deps.runLiveBrowser(pi, { target: params.target, url: params.url, timeoutMs: params.timeoutMs })
					: deps.buildLiveBrowserOutput(action, {
							target: params.target,
							url: params.url,
							timeoutMs: params.timeoutMs,
						});
			return {
				content: [{ type: "text" as const, text: truncateMiddle(text, 20000) }],
				details: {
					action,
					path: deps.latestLiveBrowserArtifactPath(),
					target: params.target,
					url: params.url,
				} as Record<string, unknown>,
			};
		},
	});
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
			return {
				content: [{ type: "text" as const, text: truncateMiddle(text, 20000) }],
				details: {
					action,
					path: deps.latestWebAuthzStateArtifactPath(),
					target: params.target,
					url: params.url,
				} as Record<string, unknown>,
			};
		},
	});
	// Landmark: re_js_signing registration (body in tools-web-js.ts)
	registerRepiReverseJsSigningTool(registerTool, pi, deps);
}
