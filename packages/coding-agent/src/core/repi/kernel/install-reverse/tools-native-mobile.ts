/** Reverse install tool: re_mobile_runtime. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { auditCompletion } from "../../completion-audit.ts";
import { readCurrentMission } from "../../mission.ts";
import { tryReuseRecentMobileRuntimeArtifact } from "./tools-mobile-reuse.ts";
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
			try {
				const mission = readCurrentMission();
				const reverseDone = Boolean(
					mission?.checkpoints?.some(
						(c: { name?: string; status?: string }) =>
							(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven") && c.status === "done",
					),
				);
				if (reverseDone && action === "run") {
					const audit = auditCompletion();
					if (audit?.ready) {
						const nl = String.fromCharCode(10);
						const text = [
							"mobile_runtime:",
							"status: reverse_ready_stop",
							"note: reverse_runtime_gate already satisfied for this mission; do not re-run mobile runtime without a real blocker",
							"next: write HARNESS_BUGS/PROOF only",
						].join(nl);
						return {
							content: [{ type: "text" as const, text }],
							details: {
								action,
								skipped: true,
								reason: "reverse_ready_stop",
								target: params.target,
								packageName: params.packageName,
							} as Record<string, unknown>,
						};
					}
				}
			} catch {
				/* optional */
			}
			if (action === "run") {
				try {
					const reused = tryReuseRecentMobileRuntimeArtifact({
						target: params.target,
						packageName: params.packageName,
						latestPath: deps.latestMobileRuntimeArtifactPath?.(),
						ttlMs: 120_000,
					});
					if (reused) {
						const nl = String.fromCharCode(10);
						const note = [
							"mobile_runtime:",
							"status: reuse",
							`path: ${reused.path}`,
							`ageMs: ${reused.ageMs}`,
							"note: latest same-target mobile capture within 120s; do not re-run",
							"next: re_domain_proof_exit show",
						].join(nl);
						return {
							content: [{ type: "text" as const, text: `${note}${nl}${nl}${reused.body}` }],
							details: {
								action: "reuse",
								reused: true,
								path: reused.path,
								target: params.target,
								packageName: params.packageName,
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
			return {
				content: [{ type: "text" as const, text }],
				details: {
					action,
					path: deps.latestMobileRuntimeArtifactPath(),
					target: params.target,
					packageName: params.packageName,
				} as Record<string, unknown>,
			};
		},
	});
}
