/** Register REPI bootstrap/complete tools (reverse proof.exit gates). */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
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
		parameters: Type.Object({
			action: Type.Optional(Type.Union([Type.Literal("audit"), Type.Literal("scaffold")])),
			title: Type.Optional(Type.String()),
		}),
		async execute(_toolCallId, params: any, _signal?: any, _onUpdate?: any, _ctx?: any) {
			const action = params.action ?? "audit";
			if (action === "scaffold") {
				const path = deps.writeReportScaffold(params.title);
				return {
					content: [{ type: "text" as const, text: `${path}\n\n${deps.formatCompletionAudit()}` }],
					details: { path } as Record<string, unknown>,
				};
			}
			const audit = deps.auditCompletion();
			const memoryEvent = deps.appendCompletionMemoryEvent(audit);
			const refreshedAudit = memoryEvent ? deps.auditCompletion() : audit;
			const auditText = typeof refreshedAudit === "string" ? refreshedAudit : JSON.stringify(refreshedAudit);
			const reverseOpen =
				/proof_exit|bind_ready|reverse_proof|pending_runtime_capture/i.test(auditText) &&
				!/proof_exit\s*=\s*(partial_runtime_capture|runtime_capture_strong)/i.test(auditText);
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
							memoryEvent ? `\ncompletion_memory_event: ${memoryEvent.id}` : undefined,
							reverseFooter || undefined,
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
