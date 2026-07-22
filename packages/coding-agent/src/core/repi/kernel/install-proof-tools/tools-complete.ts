/** Register REPI bootstrap/complete tools (reverse proof.exit gates). */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { softFillOptionalOrchestrationWhenReverseReadyAsync } from "../../completion-audit/soft-fill-optional.ts";
import { readCurrentMission } from "../../mission.ts";
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG as TOOL_BOOTSTRAP_CATALOG } from "../../toolchain.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiCompleteBootstrapTools(
	registerTool: ToolRegistrar,
	pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	registerTool({
		name: "re_bootstrap",
		label: "RE Bootstrap",
		description: "Plan or execute bootstrap commands for missing reverse/pentest tools and refresh the tool index.",
		promptSnippet: "Use tool-index driven bootstrap instead of guessing missing tool installation.",
		promptGuidelines: [
			"Call re_bootstrap plan before installing missing tools.",
			"Only call re_bootstrap install for tools required by the active mission lane.",
		],
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("show"), Type.Literal("plan"), Type.Literal("install")])),
			tools: Type.Optional(Type.Array(Type.String())),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const tools = params.tools?.length
				? params.tools
				: params.action === "show"
					? TOOL_BOOTSTRAP_CATALOG.map((entry: any) => entry.tool)
					: ["checksec", "gdb", "radare2", "binwalk", "nmap", "ffuf"];
			const text =
				params.action === "install"
					? await deps.installBootstrapTools(pi, tools)
					: deps.formatBootstrapPlan(deps.createBootstrapPlan(tools));
			return {
				content: [{ type: "text" as const, text }],
				details: { tools, action: params.action } as Record<string, unknown>,
			};
		},
	});
	registerTool({
		name: "re_complete",
		label: "RE Complete",
		description:
			"Audit REPI completion checkpoints or write a report scaffold from mission/evidence state. Reverse-heavy completion requires runtime proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true (re_domain_proof_exit / re_runtime_adapter).",
		promptSnippet: "Audit completion checkpoints before claiming a reverse/pentest task is done.",
		promptGuidelines: [
			"Before final answers on reverse/pentest tasks, run re_complete audit or perform an equivalent checkpoint check.",
		],
		parameters: Type.Object(
			{
				action: Type.Optional(Type.String()),
				title: Type.Optional(Type.String()),
			},
			{ additionalProperties: true },
		),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const raw = String(params.action ?? "audit").toLowerCase();
			const action = raw === "scaffold" || raw === "report" ? "scaffold" : "audit";
			if (action === "scaffold") {
				const path = deps.writeReportScaffold(params.title);
				return {
					content: [{ type: "text" as const, text: `${path}\n\n${deps.formatCompletionAudit()}` }],
					details: { path } as Record<string, unknown>,
				};
			}
			let audit = deps.auditCompletion();
			// Soft-fill only when reverse is ready but optional checkpoints remain.
			// Avoid re-running authz/graph builds on repeated re_complete after already filled.
			const missionPending =
				readCurrentMission()
					?.checkpoints?.filter((c: { status?: string }) => c.status !== "done")
					.map((c: { name?: string }) => String(c.name)) ?? [];
			const softFillTargets = new Set([
				"execution_kernel_ready",
				"decision_core_ready",
				"attack_graph_ready",
				"operation_queue_ready",
				"operator_queue_ready",
				"verifier_matrix_ready",
				"compiler_ready",
				"replay_ready",
				"report_or_writeup_ready",
				"web_authz_ready",
			]);
			const needsSoftFill = missionPending.some((name: string) => softFillTargets.has(name));
			let softFilled: string[] = [];
			if (audit?.ready && needsSoftFill) {
				softFilled = await softFillOptionalOrchestrationWhenReverseReadyAsync(audit as any, pi);
				if (softFilled.length) audit = deps.auditCompletion();
			}
			const memoryEvent = softFilled.length || !audit?.ready ? deps.appendCompletionMemoryEvent(audit) : undefined;
			const refreshedAudit = softFilled.length ? deps.auditCompletion() : audit;
			const auditText = typeof refreshedAudit === "string" ? refreshedAudit : JSON.stringify(refreshedAudit);
			const formattedAudit = deps.formatCompletionAuditFromAudit(refreshedAudit as any);
			const ready =
				Boolean((refreshedAudit as any)?.ready) ||
				/completion_status:\s*ready|reverse_runtime_gate:\s*satisfied/i.test(formattedAudit);
			const hasRuntimeProof =
				/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)|reverse\.proof_exit=(partial_runtime_capture|runtime_capture_strong)/i.test(
					`${auditText}\n${formattedAudit}`,
				);
			// Only inject reverse_next when proof is still open — never after ready+bind (stops post-complete thrash).
			const reverseOpen = !ready && !hasRuntimeProof;
			const reverseFooter = reverseOpen
				? "\n\nreverse_domain_next:\n" +
					reverseDomainCaptureNextCommands({ routeOrBlob: auditText })
						.slice(0, 4)
						.map((cmd: any) => `- next: ${cmd}`)
						.join("\n")
				: "";
			return {
				content: [
					{
						type: "text" as const,
						text: [
							deps.formatCompletionAuditFromAudit(refreshedAudit),
							softFilled.length ? `soft_fill_optional: ${softFilled.join(",")}` : undefined,
							memoryEvent ? `\ncompletion_memory_event: ${memoryEvent.id}` : undefined,
							reverseFooter || undefined,
							ready
								? "completion_stop: ready\nnext: write HARNESS_BUGS/PROOF only — do not call re_operator/re_route/re_runtime_adapter without a real blocker"
								: undefined,
						]
							.filter(Boolean)
							.join("\n"),
					},
				],
				details: { ...refreshedAudit, memoryEvent } as unknown as Record<string, unknown>,
			};
		},
	});
}
