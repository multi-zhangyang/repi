/** Register REPI bootstrap/complete/profile/tools slash commands. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, ProofLoopToolDeps } from "./types.ts";

/** reverse: complete audit requires proof.exit/bind_ready for reverse-heavy missions */
export function registerRepiProofBootstrapCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	registerCommand("re-bootstrap", {
		description: "Plan or install missing REPI tools: /re-bootstrap [plan|install] tool1 tool2 ...",
		handler: async (args: any) => {
			const [action = "plan", ...tools] = args.trim().split(/\s+/).filter(Boolean);
			const targetTools = tools.length > 0 ? tools : ["checksec", "gdb", "radare2", "binwalk", "nmap", "ffuf"];
			const text =
				action === "install"
					? await deps.installBootstrapTools(pi, targetTools)
					: deps.formatBootstrapPlan(deps.createBootstrapPlan(targetTools));
			deps.sendDisplayMessage(pi, "REPI Bootstrap", text);
		},
	});

	registerCommand("re-complete", {
		description:
			"Audit REPI completion checkpoints or write a report scaffold: /re-complete [audit|scaffold] Reverse-heavy: require proof.exit=partial_runtime_capture|runtime_capture_strong and bind_ready=true.",
		handler: async (args: any) => {
			const action = args.trim() || "audit";
			if (action.startsWith("scaffold")) {
				const title = action.slice("scaffold".length).trim() || undefined;
				const path = deps.writeReportScaffold(title);
				deps.sendDisplayMessage(pi, "REPI Report Scaffold", `${path}\n\n${deps.formatCompletionAudit()}`);
				return;
			}
			const audit = deps.auditCompletion();
			const memoryEvent = deps.appendCompletionMemoryEvent(audit);
			const refreshedAudit = memoryEvent ? deps.auditCompletion() : audit;
			deps.sendDisplayMessage(
				pi,
				"REPI Completion Audit",
				[
					deps.formatCompletionAuditFromAudit(refreshedAudit),
					memoryEvent ? `\ncompletion_memory_event: ${memoryEvent.id}` : undefined,
				]
					.filter(Boolean)
					.join("\n"),
			);
		},
	});

	registerCommand("re-profile-check", {
		description: "Run/show REPI profile checks: /re-profile-check [quick|full|install|show]",
		handler: async (args: any) => {
			const action = args.trim().split(/\s+/).filter(Boolean)[0];
			const mode =
				action === "full" || action === "install" || action === "show" || action === "quick" ? action : "quick";
			deps.sendDisplayMessage(pi, "REPI Profile Check", deps.buildProfileCheckOutput(mode));
		},
	});

	registerCommand("re-tools", {
		description: "Show or refresh REPI tool index: /re-tools [show|refresh]",
		handler: async (args: any) => {
			const action = args.trim() || "show";
			const text = action === "refresh" ? await deps.refreshToolIndex(pi) : deps.buildToolDigest();
			deps.updateMissionCheckpoint("tool_index_checked", "done", `/re-tools ${action}`);
			deps.sendDisplayMessage(pi, "REPI Tool Index", deps.truncateMiddle(text, 9000));
		},
	});
}
