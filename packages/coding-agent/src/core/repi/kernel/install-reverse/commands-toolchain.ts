import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, ReverseRuntimeToolDeps } from "./types.ts";

export function registerRepiReverseToolchainCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ReverseRuntimeToolDeps,
): void {
	registerCommand("re-toolchain", {
		description: "Show REPI domain toolchain capability matrix: /re-toolchain [show|refresh] [domain]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "refresh" ? (parts.shift() as "refresh") : "show";
			if (first === "show") parts.shift();
			if (action === "refresh") await deps.refreshToolIndex(pi);
			const text = deps.buildToolchainDomainCapabilityOutput("show", parts.join(" ") || undefined);
			deps.updateMissionCheckpoint("tool_index_checked", "done", `/re-toolchain ${action}`);
			deps.sendDisplayMessage(pi, "REPI Toolchain Domain Capability", deps.truncateMiddle(text, 16000));
		},
	});

	registerCommand("re-runtime-bridge", {
		description:
			"Show/refresh REPI professional runtime bridges: /re-runtime-bridge [show|refresh] [tool-bridge-runtime|exploit-verifier-runtime|web-cdp-replay|mobile-frida]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "refresh" ? (parts.shift() as "refresh") : "show";
			if (first === "show") parts.shift();
			if (action === "refresh") await deps.refreshToolIndex(pi);
			const report = deps.buildProfessionalRuntimeBridgesGate(parts.join(" ") || undefined);
			const path = deps.writeProfessionalRuntimeBridgesArtifact(report);
			deps.updateMissionCheckpoint("tool_index_checked", "done", "ProfessionalRuntimeBridgesCheckV1");
			deps.sendDisplayMessage(
				pi,
				"REPI Professional Runtime Bridges",
				deps.truncateMiddle(deps.formatProfessionalRuntimeBridgesGate(report, path), 22000),
			);
		},
	});

	registerCommand("re-runtime-adapter", {
		description:
			"Show/plan/run REPI runtime adapters: /re-runtime-adapter [show|plan|run|refresh] [adapter-id] [target] [timeout-ms]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action =
				first === "plan" || first === "run" || first === "refresh"
					? (parts.shift() as "plan" | "run" | "refresh")
					: "show";
			if (first === "show") parts.shift();
			const maybeTimeout = parts.at(-1);
			const timeoutMs = maybeTimeout && /^\d+$/.test(maybeTimeout) ? Number(parts.pop()) : undefined;
			const adapter = parts[0]?.includes("adapter") ? parts.shift() : undefined;
			const target = parts.join(" ") || undefined;
			if (action === "refresh") await deps.refreshToolIndex(pi);
			const text =
				action === "run"
					? await deps.runRuntimeAdapterExecution(pi, { adapter, target, timeoutMs })
					: (() => {
							const report = deps.buildRuntimeAdapterExecutionGate(adapter || target);
							const path = deps.writeRuntimeAdapterExecutionArtifact(report);
							return deps.formatRuntimeAdapterExecutionGate(report, path);
						})();
			deps.updateMissionCheckpoint("tool_index_checked", "done", "RuntimeAdapterExecutionCheckV1");
			deps.sendDisplayMessage(pi, "REPI Runtime Adapter Execution", deps.truncateMiddle(text, 24000));
		},
	});

	registerCommand("re-domain-proof-exit", {
		description:
			"Show/write REPI domain proof-exit closure from runtime artifacts: /re-domain-proof-exit [show|write] [domain]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "write" ? (parts.shift() as "write") : "show";
			if (first === "show") parts.shift();
			const domain = parts.join(" ") || undefined;
			const text = deps.buildDomainProofExitClosureOutput(action, domain);
			deps.sendDisplayMessage(pi, "REPI Domain Proof Exit Closure", deps.truncateMiddle(text, 18000));
		},
	});
}
