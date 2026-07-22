/** Narrative reverse/pentest command registrations (runtime capture + bind_ready gates). */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, NarrativeToolDeps } from "./types.ts";

export function registerRepiNarrativeReverseCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	// Reverse: swarm/operator claim remains blocked until runtime capture + bind_ready / proof_exit.
	registerCommand("re-chain", {
		description: "Plan/show/compose REPI exploit chain: /re-chain [plan|show|compose] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "compose" ? (parts.shift() as "show" | "compose") : "plan";
			if (first === "plan") parts.shift();
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Exploit Chain", deps.buildExploitChainOutput(action, { target }));
		},
	});

	registerCommand("re-campaign", {
		description: "Build/show REPI reverse/pentest campaign graph: /re-campaign [plan|show] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" ? "show" : "plan";
			if (first === "show" || first === "plan") parts.shift();
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Campaign Graph", deps.buildCampaignOutput(action, { target }));
		},
	});

	registerCommand("re-operation", {
		description: "Build/show/run REPI operation queue: /re-operation [plan|next|show|run] [target] [max-steps]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action =
				first === "show" || first === "next" || first === "run"
					? (parts.shift() as "show" | "next" | "run")
					: "plan";
			const last = parts.at(-1);
			const maxSteps = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runOperationQueue(pi, { target, maxSteps })
					: deps.buildOperationOutput(action, { target });
			deps.sendDisplayMessage(pi, "REPI Operation Queue", text);
		},
	});

	registerCommand("re-delegate", {
		description: "Build/show/merge REPI specialist worker packets: /re-delegate [plan|show|merge] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "merge" ? (parts.shift() as "show" | "merge") : "plan";
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Delegation Plan", deps.buildDelegateOutput(action, { target }));
		},
	});

	registerCommand("re-swarm", {
		description:
			"Build/show/run/merge REPI multi-specialist swarm runtime packets plus ReconParallelPlanV1/planCoverage/releaseCheckMetadata: /re-swarm [plan|show|run|merge] [target] [max-workers] [max-commands]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action =
				first === "show" || first === "run" || first === "merge"
					? (parts.shift() as "show" | "run" | "merge")
					: "plan";
			const maxCommands = action === "run" && /^\d+$/.test(parts.at(-1) ?? "") ? Number(parts.pop()) : undefined;
			const maxWorkers = action === "run" && /^\d+$/.test(parts.at(-1) ?? "") ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runSwarm(pi, { target, maxWorkers, maxCommands })
					: deps.buildSwarmOutput(action, { target });
			deps.sendDisplayMessage(pi, "REPI Swarm Plan", text);
		},
	});

	registerCommand("re-supervisor", {
		description:
			"Review/show/repair REPI worker packets with ReconParallelPlanV1, planCoverage, and claimCheckPolicy checkpoints: /re-supervisor [review|show|repair] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "repair" ? (parts.shift() as "show" | "repair") : "review";
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Supervisor Review", await deps.buildSupervisorOutput(action, { target }));
		},
	});
}
