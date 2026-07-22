/** Full-surface control-plane commands (kernel/decision). */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, ControlPlaneToolDeps } from "./commands-types.ts";

export function registerRepiControlPlaneFullCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerCommand("re-kernel", {
		description: "Build/show/audit REPI execution kernel directives: /re-kernel [build|show|audit] [target]",
		handler: async (args: string) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "audit" ? (parts.shift() as "show" | "audit") : "build";
			if (first === "build") parts.shift();
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Execution Kernel", deps.buildKernelOutput(action, { target }));
		},
	});

	registerCommand("re-decision", {
		description: "Plan/show/tick/run REPI decision core: /re-decision [plan|show|tick|run] [target] [max-steps]",
		handler: async (args: string) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action =
				first === "show" || first === "tick" || first === "run"
					? (parts.shift() as "show" | "tick" | "run")
					: "plan";
			if (first === "plan") parts.shift();
			const last = parts.at(-1);
			const maxSteps = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runDecisionCore(pi, { target, maxSteps })
					: deps.buildDecisionCoreOutput(action, { target });
			deps.sendDisplayMessage(pi, "REPI Decision Core", text);
		},
	});
}
