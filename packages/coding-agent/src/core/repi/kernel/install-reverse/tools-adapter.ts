/** Reverse install tools: runtime adapter / domain proof / toolchain. */

import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { updateMissionCheckpoint } from "../../mission.ts";
import { buildRuntimeAdapterDemoteNote } from "./tools-adapter-demote.ts";
import { registerRepiDomainProofExitTool } from "./tools-adapter-domain-proof.ts";
import { tryReverseReadyRuntimeAdapterStop } from "./tools-adapter-ready-stop.ts";
import { runRuntimeAdapterCoalesced, tryReuseRecentRuntimeAdapterArtifact } from "./tools-adapter-reuse.ts";
import { pickAdapterIdForRun, resolveAdapterRunTarget } from "./tools-adapter-target.ts";
import { registerRepiToolchainDomainTool } from "./tools-adapter-toolchain.ts";
import { markMissionReverseBound, releaseCaptureSlot, tryAcquireCaptureSlot } from "./tools-capture-inflight.ts";
import type { ReverseRuntimeToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiReverseAdapterTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerTool({
		name: "re_runtime_bridge",
		label: "RE Professional Runtime Bridges",
		description:
			"Inspect ProfessionalRuntimeBridgesCheckV1: real toolchain bridge, exploit verifier runtime, Web/CDP replay harness, and Frida/Mobile dynamic bridge with artifact-backed command plans.",
		promptSnippet:
			"Use re_runtime_bridge when a reverse/pentest task needs concrete external tool bridging, replay verification, CDP capture, or Frida/mobile dynamic analysis.",
		promptGuidelines: [
			"Call re_runtime_bridge show before claiming a toolchain or dynamic bridge is missing.",
			"Use the bridge nextRuntimeCommands to drive re_live_browser, re_mobile_runtime, re_exploit_lab, re_replayer, and re_domain_proof_exit.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("show"), Type.Literal("refresh")])),
			bridge: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "show";
			if (action === "refresh") await deps.refreshToolIndex(pi);
			const report = deps.buildProfessionalRuntimeBridgesGate(params.bridge);
			const path = deps.writeProfessionalRuntimeBridgesArtifact(report);
			return {
				content: [
					{
						type: "text" as const,
						text: deps.truncateMiddle(deps.formatProfessionalRuntimeBridgesGate(report, path), 22000),
					},
				],
				details: { action, bridge: params.bridge, path, closure: report.closure } as Record<string, unknown>,
			};
		},
	});
	registerTool({
		name: "re_runtime_adapter",
		label: "RE Runtime Adapter Execution",
		description:
			"Plan or run RuntimeAdapterExecutionCheckV1 adapters that bind runner commands, parser rules, artifact kinds, ingest targets, and proof-exit signals for r2/Ghidra/Frida/CDP/pwntools/tshark/binwalk style workflows.",
		promptSnippet:
			"Use re_runtime_adapter to execute a bounded local adapter and parse output into evidence before claiming a reverse/pentest tool result.",
		promptGuidelines: [
			"Call re_runtime_adapter show or plan to choose an adapter with native/fallback status; if only a target is provided, REPI auto-detects URL/PCAP/APK/firmware/native/GDB-oriented adapters.",
			"Call re_runtime_adapter run only with an explicit target and bounded timeout; then feed the artifact to re_verifier and re_domain_proof_exit.",
		],
		parameters: Type.Object(
			{
				action: Type.Optional(Type.String()),
				adapter: Type.Optional(Type.String()),
				target: Type.Optional(Type.String()),
				timeoutMs: Type.Optional(Type.Number()),
			},
			{ additionalProperties: true },
		),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const raw = String(params.action ?? "")
				.trim()
				.toLowerCase();
			const hasTarget = Boolean(params.target && String(params.target).trim());
			// URL/target present ⇒ run (not plan/show false success), same policy as browser/authz/native.
			const action =
				raw === "run" || raw === "show" || raw === "plan" || raw === "refresh" ? raw : hasTarget ? "run" : "show";
			if (action === "refresh") await deps.refreshToolIndex(pi);
			if (action === "run") {
				const readyStop = tryReverseReadyRuntimeAdapterStop({
					action,
					adapter: params.adapter,
					target: params.target,
				});
				if (readyStop) return readyStop;
				const resolvedTarget = resolveAdapterRunTarget(params.target);
				const adapter = pickAdapterIdForRun({
					adapter: params.adapter,
					target: params.target,
					resolvedTarget,
				});
				if (!tryAcquireCaptureSlot("runtime_adapter")) {
					const text = [
						"runtime_adapter:",
						"status: reverse_ready_stop",
						"note: another capture is already in-flight for this mission; do not thrash",
						"next: re_domain_proof_exit show → re_operator plan/dispatch → re_complete → HARNESS_BUGS/PROOF only",
					].join("\n");
					return {
						content: [{ type: "text" as const, text }],
						details: {
							action,
							skipped: true,
							reason: "reverse_ready_stop",
							adapter,
							target: params.target,
						} as Record<string, unknown>,
					};
				}
				// Optimistic soft-mark so concurrent thrash hits reverse_ready_stop mid-flight.
				if (adapter) {
					try {
						markMissionReverseBound();
						updateMissionCheckpoint("reverse_proof_exit_ready", "pending", `runtime_adapter ${adapter} starting`);
						updateMissionCheckpoint("minimal_path_proven", "pending", `runtime_adapter ${adapter} starting`);
					} catch {
						/* optional */
					}
				}
				try {
					const reused = tryReuseRecentRuntimeAdapterArtifact({
						adapterId: adapter,
						target: resolvedTarget ?? params.target,
						ttlMs: 120_000,
					});
					if (reused) {
						const nl = String.fromCharCode(10);
						// Soft-mark reverse proof so thrash-stop engages even when models only hit reuse.
						try {
							updateMissionCheckpoint(
								"reverse_proof_exit_ready",
								"pending",
								`runtime_adapter ${reused.adapterId} ${reused.path}`,
							);
							updateMissionCheckpoint(
								"minimal_path_proven",
								"pending",
								`runtime_adapter ${reused.adapterId} ${reused.path}`,
							);
						} catch {
							/* optional */
						}
						const note = [
							"runtime_adapter:",
							"status: reuse",
							`adapter: ${reused.adapterId}`,
							`path: ${reused.path}`,
							`ageMs: ${reused.ageMs}`,
							"note: latest same adapter+target capture within 120s; do not re-run",
							"next: re_domain_proof_exit show",
						].join(nl);
						releaseCaptureSlot("runtime_adapter");
						return {
							content: [{ type: "text" as const, text: note }],
							details: {
								action: "reuse",
								reused: true,
								path: reused.path,
								adapter: reused.adapterId,
								target: params.target,
								ageMs: reused.ageMs,
							} as Record<string, unknown>,
						};
					}
				} catch {
					/* optional */
				}
				const { demoted, note: demoteNote } = buildRuntimeAdapterDemoteNote({
					requested: params.adapter,
					adapter,
				});
				const { text, coalesced } = await runRuntimeAdapterCoalesced({
					adapterId: adapter,
					target: resolvedTarget ?? params.target,
					run: () =>
						deps.runRuntimeAdapterExecution(pi, {
							adapter,
							target: resolvedTarget,
							timeoutMs: params.timeoutMs,
						}),
				});
				releaseCaptureSlot("runtime_adapter");
				return {
					content: [
						{
							type: "text" as const,
							text: deps.truncateMiddle(
								demoteNote +
									(coalesced
										? `runtime_adapter:\nstatus: coalesce\nnote: joined in-flight same adapter+target run\n\n${text}`
										: text),
								24000,
							),
						},
					],
					details: {
						action,
						adapter,
						requestedAdapter: params.adapter,
						demoted,
						target: params.target,
						coalesced,
					} as Record<string, unknown>,
				};
			}
			const report = deps.buildRuntimeAdapterExecutionGate(params.adapter ?? params.target);
			const path = deps.writeRuntimeAdapterExecutionArtifact(report);
			return {
				content: [
					{
						type: "text" as const,
						text: deps.truncateMiddle(deps.formatRuntimeAdapterExecutionGate(report, path), 24000),
					},
				],
				details: { action, adapter: params.adapter, path, closure: report.closure } as Record<string, unknown>,
			};
		},
	});
	registerRepiDomainProofExitTool(registerTool, pi, deps);
	registerRepiToolchainDomainTool(registerTool, pi, deps);
}
