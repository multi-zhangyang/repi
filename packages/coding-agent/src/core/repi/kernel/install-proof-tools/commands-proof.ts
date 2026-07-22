/** Register REPI verifier/compiler/replayer/autofix/proof-loop slash commands. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, ProofLoopToolDeps } from "./types.ts";

/** reverse: proof commands surface capture gates for reverse-heavy missions */
export function registerRepiProofChainCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ProofLoopToolDeps,
): void {
	registerCommand("re-verifier", {
		description: "Check/show/matrix REPI verifier matrix: /re-verifier [check|show|matrix] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "matrix" ? (parts.shift() as "show" | "matrix") : "check";
			if (first === "check") parts.shift();
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Verifier Matrix", deps.buildVerifierOutput(action, { target }));
		},
	});

	registerCommand("re-compiler", {
		description: "Draft/show/finalize REPI compiled report: /re-compiler [draft|show|final] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "final" ? (parts.shift() as "show" | "final") : "draft";
			if (first === "draft") parts.shift();
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Compiler Report", deps.buildCompilerOutput(action, { target }));
		},
	});

	registerCommand("re-replayer", {
		description: "Plan/show/run REPI replay matrix: /re-replayer [plan|show|run] [target] [max-steps]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "run" ? (parts.shift() as "show" | "run") : "plan";
			if (first === "plan") parts.shift();
			const last = parts.at(-1);
			const maxSteps = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runReplayer(pi, { target, maxSteps })
					: deps.buildReplayerOutput(action, { target });
			deps.sendDisplayMessage(pi, "REPI Replay Matrix", text);
		},
	});

	registerCommand("re-autofix", {
		description: "Plan/show/apply REPI replay repair queues: /re-autofix [plan|show|apply] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "apply" ? (parts.shift() as "show" | "apply") : "plan";
			if (first === "plan") parts.shift();
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Autofix Plan", deps.buildAutofixOutput(action, { target }));
		},
	});

	registerCommand("re-proof-loop", {
		description:
			"Plan/show/run REPI verifier→compiler→replayer→autofix proof loop with specialist swarm bridge: /re-proof-loop [plan|show|run] [target] [max-steps] [replay-steps]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "run" ? (parts.shift() as "show" | "run") : "plan";
			if (first === "plan") parts.shift();
			const maybeReplaySteps = parts.at(-1);
			const replaySteps = maybeReplaySteps && /^\d+$/.test(maybeReplaySteps) ? Number(parts.pop()) : undefined;
			const maybeMaxSteps = parts.at(-1);
			const maxSteps = maybeMaxSteps && /^\d+$/.test(maybeMaxSteps) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "run"
					? await deps.runProofLoop(pi, { target, maxSteps, replaySteps })
					: deps.buildProofLoopOutput(action, { target, maxSteps, replaySteps });
			deps.sendDisplayMessage(pi, "REPI Proof Loop", text);
		},
	});
}
