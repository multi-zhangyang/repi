/** Reverse install tool: re_live_browser. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { updateMissionCheckpoint } from "../../mission.ts";
import { truncateMiddle } from "../../text.ts";
import { markMissionReverseBound, releaseCaptureSlot, tryAcquireCaptureSlot } from "./tools-capture-inflight.ts";
import { reverseProofBound, softMarkReverseFromNative } from "./tools-native-ready.ts";
import { tryReuseRecentLiveBrowserArtifact } from "./tools-web-browser-reuse.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

function reverseReadyStop(params: { action: string; target?: string; url?: string }) {
	const text = [
		"live_browser:",
		"status: reverse_ready_stop",
		"note: reverse capture already bound; do not thrash re_live_browser",
		"next: re_domain_proof_exit show → re_operator plan/dispatch → re_complete → HARNESS_BUGS/PROOF only",
	].join("\n");
	return {
		content: [{ type: "text" as const, text }],
		details: {
			action: params.action,
			skipped: true,
			reason: "reverse_ready_stop",
			target: params.target,
			url: params.url,
		} as Record<string, unknown>,
	};
}

export function registerRepiReverseLiveBrowserTool(
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
			"Call re_live_browser run with a concrete HTTP(S) URL for request/response/storage/WebSocket capture.",
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
			const url = String(params.url || params.target || "").trim();
			const hasHttpTarget = /^https?:\/\//i.test(url);
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
			if (action === "run" && reverseProofBound()) {
				return reverseReadyStop({ action, target: params.target, url: params.url });
			}
			if (action === "run") {
				if (!tryAcquireCaptureSlot("live_browser")) {
					return reverseReadyStop({ action, target: params.target, url: params.url });
				}
				markMissionReverseBound();
			}
			if (action === "run" && hasHttpTarget) {
				try {
					const reused = tryReuseRecentLiveBrowserArtifact({
						url,
						latestPath: deps.latestLiveBrowserArtifactPath?.({ target: url }),
					});
					if (reused) {
						try {
							updateMissionCheckpoint("live_browser_ready", "done", reused.path);
							softMarkReverseFromNative(reused.path);
						} catch {
							/* optional */
						}
						releaseCaptureSlot("live_browser");
						const note = `browser_reuse: latest artifact within 120s for same URL (ageMs=${reused.ageMs})\npath: ${reused.path}\n`;
						return {
							content: [{ type: "text" as const, text: truncateMiddle(note + reused.body, 20000) }],
							details: {
								action: "reuse",
								path: reused.path,
								target: params.target,
								url: params.url,
								reused: true,
							} as Record<string, unknown>,
						};
					}
				} catch {
					/* optional */
				}
			}
			const text =
				action === "run"
					? await deps.runLiveBrowser(pi, { target: params.target, url: params.url, timeoutMs: params.timeoutMs })
					: deps.buildLiveBrowserOutput(action, {
							target: params.target,
							url: params.url,
							timeoutMs: params.timeoutMs,
						});
			if (action === "run") {
				try {
					const path = deps.latestLiveBrowserArtifactPath?.();
					if (path) {
						updateMissionCheckpoint("live_browser_ready", "done", path);
						softMarkReverseFromNative(path);
					}
				} catch {
					/* optional */
				}
				releaseCaptureSlot("live_browser");
			}
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
}
