/** Reverse install tool: re_mobile_runtime. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { tryReuseRecentMobileRuntimeArtifact } from "./tools-mobile-reuse.ts";
import { reverseProofBound, softMarkReverseFromNative } from "./tools-native-ready.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiReverseMobileTool(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerTool({
		name: "re_mobile_runtime",
		label: "RE Mobile Runtime",
		description:
			"Plan, show, or run Android/APK mobile runtime capture with ADB/Frida readiness, APK inventory, process map, Java crypto hooks, native compare hooks, anti-debug checks, and replay commands.",
		promptSnippet:
			"Use re_mobile_runtime for APK/Android/mobile reverse tasks after re_map or before claiming runtime hook, crypto, native compare, anti-debug, or package behavior.",
		promptGuidelines: [
			"Call re_mobile_runtime run for APK/package targets to generate ADB/Frida hook strategy and artifact contract.",
			"Call re_mobile_runtime run with a concrete APK or packageName to capture tool readiness, device/process map, hook template, anti-debug strings, and runtime anchors.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("plan"), Type.Literal("show"), Type.Literal("run")])),
			target: Type.Optional(Type.String()),
			packageName: Type.Optional(Type.String()),
			timeoutMs: Type.Optional(Type.Number()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const hasTarget = Boolean(String(params.target || params.url || params.packageName || "").trim());
			const action = params.action ?? (hasTarget ? "run" : "run");
			if (action === "run" && reverseProofBound()) {
				const text = [
					"mobile_runtime:",
					"status: reverse_ready_stop",
					"note: reverse capture already bound; do not thrash re_mobile_runtime",
					"next: re_domain_proof_exit show → re_operator plan/dispatch → re_complete → HARNESS_BUGS/PROOF only",
				].join("\n");
				return {
					content: [{ type: "text" as const, text }],
					details: { action, skipped: true, reason: "reverse_ready_stop", target: params.target } as Record<
						string,
						unknown
					>,
				};
			}
			if (action === "run") {
				try {
					const reused = tryReuseRecentMobileRuntimeArtifact({
						target: params.target || params.packageName,
						latestPath: deps.latestMobileRuntimeArtifactPath?.(),
						ttlMs: 120_000,
					});
					if (reused) {
						softMarkReverseFromNative(reused.path);
						const note = [
							"mobile_runtime:",
							"status: reuse",
							`path: ${reused.path}`,
							`ageMs: ${reused.ageMs}`,
							"note: latest same-target mobile capture within 120s; do not re-run",
							"next: re_domain_proof_exit show",
						].join("\n");
						return {
							content: [{ type: "text" as const, text: `${note}\n\n${reused.body}` }],
							details: {
								action: "reuse",
								reused: true,
								path: reused.path,
								target: params.target,
								ageMs: reused.ageMs,
							} as Record<string, unknown>,
						};
					}
				} catch {
					/* optional */
				}
			}
			const text =
				action === "run"
					? await deps.runMobileRuntime(pi, {
							target: params.target,
							packageName: params.packageName,
							timeoutMs: params.timeoutMs,
						})
					: deps.buildMobileRuntimeOutput(action, {
							target: params.target,
							packageName: params.packageName,
							timeoutMs: params.timeoutMs,
						});
			if (action === "run") {
				try {
					const path = deps.latestMobileRuntimeArtifactPath?.();
					if (path) softMarkReverseFromNative(path);
				} catch {
					/* optional */
				}
			}
			return {
				content: [{ type: "text" as const, text }],
				details: {
					action,
					path: deps.latestMobileRuntimeArtifactPath?.(),
					target: params.target,
					packageName: params.packageName,
				} as Record<string, unknown>,
			};
		},
	});
}
