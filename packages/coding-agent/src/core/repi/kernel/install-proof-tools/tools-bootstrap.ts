/** Register REPI re_bootstrap tool. */
import { Type } from "typebox";
import type { ExtensionAPI } from "../../../extensions/types.ts";
import { auditCompletion } from "../../completion-audit.ts";
import { readCurrentMission } from "../../mission.ts";
import { REPI_TOOL_BOOTSTRAP_CATALOG as TOOL_BOOTSTRAP_CATALOG } from "../../toolchain.ts";
import type { ProofLoopToolDeps, ToolRegistrar } from "./types.ts";

export function registerRepiBootstrapTool(
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
			// After reverse proof is ready, default bootstrap plan thrash wastes turns.
			try {
				const mission = readCurrentMission();
				const reverseDone = Boolean(
					mission?.checkpoints?.some(
						(c: { name?: string; status?: string }) =>
							(c.name === "reverse_proof_exit_ready" || c.name === "minimal_path_proven") && c.status === "done",
					),
				);
				if (reverseDone && params.action !== "install") {
					const audit = auditCompletion();
					if (audit?.ready) {
						const text = [
							"bootstrap:",
							"status: reverse_ready_stop",
							"note: reverse_runtime_gate already satisfied; do not thrash re_bootstrap plan without a real missing-tool blocker",
							"next: write HARNESS_BUGS/PROOF only",
						].join("\n");
						return {
							content: [{ type: "text" as const, text }],
							details: {
								skipped: true,
								reason: "reverse_ready_stop",
								action: params.action ?? "plan",
							} as Record<string, unknown>,
						};
					}
				}
			} catch {
				/* optional */
			}
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
}
