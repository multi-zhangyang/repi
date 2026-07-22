/** Narrative control-plane command registrations. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, NarrativeToolDeps } from "./types.ts";

export function registerRepiNarrativeControlCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: NarrativeToolDeps,
): void {
	const stats = (deps as any).stats ?? { selfReviewDue: false };
	registerCommand("re-auto", {
		description: "Run REPI bounded autopilot: /re-auto [plan|run] [--clean-state] [target] [max-auto-steps]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const action = parts[0] === "plan" || parts[0] === "run" ? (parts.shift() as "plan" | "run") : "run";
			const last = parts.at(-1);
			const maxAutoSteps = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const cleanState = parts.includes("--clean-state") || parts.includes("clean-state");
			for (let index = parts.length - 1; index >= 0; index -= 1) {
				if (parts[index] === "--clean-state" || parts[index] === "clean-state") parts.splice(index, 1);
			}
			const target = parts.join(" ") || undefined;
			const text = await deps.runAutopilot(pi, { action, target, maxAutoSteps, cleanState });
			deps.sendDisplayMessage(pi, "REPI Autopilot", text);
		},
	});

	registerCommand("re-reflect", {
		description: "Plan/show/write REPI reflection memory: /re-reflect [plan|show|write] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "write" ? (parts.shift() as "show" | "write") : "plan";
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Reflection Cycle", deps.buildReflectOutput(action, { target }));
		},
	});

	registerCommand("re-context", {
		description:
			"Pack/show/resume REPI mission context and CompactResumeLedgerV2: /re-context [pack|show|resume|resume-ledger] [target]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action =
				first === "show" || first === "resume" || first === "resume-ledger"
					? (parts.shift() as "show" | "resume" | "resume-ledger")
					: "pack";
			if (first === "pack") parts.shift();
			const target = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Context Pack", deps.buildContextOutput(action, { target }));
		},
	});

	registerCommand("re-operator", {
		description:
			"Plan/dispatch/verify/escalate REPI operator queue: /re-operator [plan|show|dispatch|verify|escalate] [target] [max-steps]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action =
				first === "show" || first === "dispatch" || first === "verify" || first === "escalate"
					? (parts.shift() as "show" | "dispatch" | "verify" | "escalate")
					: "plan";
			if (first === "plan") parts.shift();
			const last = parts.at(-1);
			const maxSteps = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text =
				action === "dispatch"
					? await deps.dispatchOperatorQueue(pi, { target, maxSteps })
					: deps.buildOperatorOutput(action, { target });
			deps.sendDisplayMessage(pi, "REPI Operator Queue", text);
		},
	});

	registerCommand("re-knowledge-graph", {
		description: "Build/show/query REPI long-term knowledge graph: /re-knowledge-graph [build|show|query] [term]",
		handler: async (args: any) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const first = parts[0];
			const action = first === "show" || first === "query" ? (parts.shift() as "show" | "query") : "build";
			if (first === "build") parts.shift();
			const query = parts.join(" ") || undefined;
			deps.sendDisplayMessage(pi, "REPI Knowledge Graph", deps.buildKnowledgeGraphOutput(action, { query }));
		},
	});

	registerCommand("re-self-review", {
		description: "Run REPI self-review checkpoint",
		handler: async () => {
			stats.selfReviewDue = false;
			deps.sendDisplayMessage(pi, "REPI Self Review", deps.makeSelfReview(stats));
		},
	});
}
