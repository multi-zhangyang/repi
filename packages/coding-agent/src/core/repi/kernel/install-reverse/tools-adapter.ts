/** Reverse install tools: runtime adapter / domain proof / toolchain. */

import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { auditCompletion } from "../../completion-audit.ts";
import { readCurrentMission } from "../../mission.ts";
import { pickAdapterIdForRun, resolveAdapterRunTarget } from "./tools-adapter-target.ts";
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
				// After reverse proof is already ready, further adapter thrash wastes wall clock.
				try {
					const mission = readCurrentMission();
					const reverseDone = Boolean(
						mission?.checkpoints?.some(
							(c: { name?: string; status?: string }) =>
								(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven") &&
								c.status === "done",
						),
					);
					// Mission-scoped thrash stop only — do not use global audit.ready (shared ledger
					// would block the first adapter run of a fresh mission).
					if (reverseDone) {
						const audit = auditCompletion();
						if (audit?.ready) {
							const text = [
								"runtime_adapter:",
								"status: reverse_ready_stop",
								"note: reverse_runtime_gate already satisfied for this mission; do not re-run adapters without a real blocker",
								"next: write HARNESS_BUGS/PROOF only",
							].join("\n");
							return {
								content: [{ type: "text" as const, text }],
								details: {
									action,
									skipped: true,
									reason: "reverse_ready_stop",
									adapter: params.adapter,
									target: params.target,
								} as Record<string, unknown>,
							};
						}
					}
				} catch {
					/* optional */
				}
				const resolvedTarget = resolveAdapterRunTarget(params.target);
				const adapter = pickAdapterIdForRun({
					adapter: params.adapter,
					target: params.target,
					resolvedTarget,
				});
				const text = await deps.runRuntimeAdapterExecution(pi, {
					adapter,
					target: resolvedTarget,
					timeoutMs: params.timeoutMs,
				});
				return {
					content: [{ type: "text" as const, text: deps.truncateMiddle(text, 24000) }],
					details: { action, adapter: params.adapter, target: params.target } as Record<string, unknown>,
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
	registerTool({
		name: "re_domain_proof_exit",
		label: "RE Domain Proof Exit Closure",
		description:
			"Check whether the active reverse/pentest domain has runtime evidence satisfying ToolchainDomainCapabilityV1 proof-exit criteria before final completion. Catalog technique.proofExit alone is insufficient; require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true.",
		promptSnippet:
			"Use re_domain_proof_exit before final claims to convert missing domain proof exits into concrete next commands.",
		promptGuidelines: [
			"Call re_domain_proof_exit show after re_lane/re_native_runtime/re_live_browser/replayer/proof-loop artifacts exist.",
			"Treat domain_proof_exit_missing blockers as commands to run, not as narrative refusal.",
			"After domain proof passes, call re_operator plan then re_operator dispatch then re_complete before final HARNESS_BUGS/PROOF.",
		],
		parameters: Type.Object(
			{
				// Coerce freely: models pass show/write/audit/run/empty.
				action: Type.Optional(Type.String()),
				domain: Type.Optional(Type.String()),
			},
			{ additionalProperties: true },
		),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			try {
				const rawAction = String(params?.action ?? "show").toLowerCase();
				const action = rawAction === "write" ? "write" : "show";
				const domain =
					typeof params?.domain === "string" && params.domain.trim() ? params.domain.trim() : undefined;
				const report = deps.buildDomainProofExitClosure(deps.readCurrentMission(), domain);
				// Always persist so mission checkpoints update even when models omit action.
				const path = deps.writeDomainProofExitClosureArtifact(report);
				const format =
					typeof deps.formatDomainProofExitClosure === "function"
						? deps.formatDomainProofExitClosure
						: (r: any, p?: string) => JSON.stringify({ path: p, status: r?.status, domain: r?.domainId });
				const nextFooter =
					report.status === "passed"
						? "\n\nnext_required:\n- re_operator plan <target>\n- re_operator dispatch <target> maxSteps=2\n- re_complete audit\n- then HARNESS_BUGS/PROOF only"
						: "";
				return {
					content: [
						{
							type: "text" as const,
							text: deps.truncateMiddle(`${format(report, path)}${nextFooter}`, 20000),
						},
					],
					details: {
						action,
						domain,
						path,
						status: report.status,
						missingProofExits: report.missingProofExits,
					} as Record<string, unknown>,
				};
			} catch (error) {
				const message = error instanceof Error ? error.stack || error.message : String(error);
				return {
					content: [
						{
							type: "text" as const,
							text: `re_domain_proof_exit error: ${message.slice(0, 4000)}`,
						},
					],
					details: { error: true, message: message.slice(0, 1000) } as Record<string, unknown>,
				};
			}
		},
	});
	registerTool({
		name: "re_toolchain_domain",
		label: "RE Toolchain Domain Capability",
		description:
			"Inspect REPI professional reverse/pentest domain capability matrix with runtime tool-index evidence, fallbacks, proof exits, and next commands.",
		promptSnippet:
			"Use re_toolchain_domain to choose concrete domain tools and fallbacks before claiming a route is blocked.",
		promptGuidelines: [
			"Call re_toolchain_domain show when a reverse/pentest task feels under-tooled or too generic.",
			"Use domain nextRuntimeCommands and recommendedInstallHints to drive re_lane/re_bootstrap rather than narrative-only advice.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("show"), Type.Literal("refresh")])),
			domain: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "show";
			if (action === "refresh") await deps.refreshToolIndex(pi);
			const report = deps.buildToolchainDomainCapability(params.domain);
			const path = deps.writeToolchainDomainCapabilityArtifact(report);
			return {
				content: [
					{
						type: "text" as const,
						text: deps.truncateMiddle(deps.formatToolchainDomainCapability(report, path), 20000),
					},
				],
				details: { action, domain: params.domain, path, coverage: report.coverage } as Record<string, unknown>,
			};
		},
	});
}
