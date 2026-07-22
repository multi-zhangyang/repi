/** Lean control-plane commands group. */
import type { ExtensionAPI } from "../../../extensions/types.ts";
import type { CommandRegistrar, ControlPlaneToolDeps } from "./commands-types.ts";

export function registerRepiControlPlaneLeanMapEvidenceCommands(
	registerCommand: CommandRegistrar,
	pi: ExtensionAPI,
	deps: ControlPlaneToolDeps,
): void {
	registerCommand("re-map", {
		description: "Run REPI passive target/workspace mapper: /re-map [target] [depth]",
		handler: async (args: string) => {
			const parts = args.trim().split(/\s+/).filter(Boolean);
			const last = parts.at(-1);
			const depth = last && /^\d+$/.test(last) ? Number(parts.pop()) : undefined;
			const target = parts.join(" ") || undefined;
			const text = await deps.runPassiveMap(pi, { target, depth });
			deps.sendDisplayMessage(pi, "REPI Passive Map", text);
		},
	});
	registerCommand("re-evidence", {
		description: "Show/search/append REPI evidence ledger: /re-evidence [show|search|append] ...",
		handler: async (args: string) => {
			const trimmed = args.trim();
			if (trimmed.startsWith("append ")) {
				const body = trimmed.slice("append ".length).trim();
				const [titlePart, factPart] = body.split("::", 2);
				const evidence = deps.appendEvidence({
					kind: "note",
					title: titlePart?.trim() || "manual evidence",
					fact: factPart?.trim() || body || "manual evidence",
					confidence: "operator-note",
				});
				deps.sendDisplayMessage(pi, "REPI Evidence Appended", `evidence: ${evidence.timestamp} ${evidence.title}`);
				return;
			}
			if (trimmed.startsWith("search ")) {
				deps.sendDisplayMessage(
					pi,
					"REPI Evidence Search",
					deps.buildEvidenceDigest(trimmed.slice("search ".length)),
				);
				return;
			}
			deps.sendDisplayMessage(pi, "REPI Evidence", deps.buildEvidenceDigest());
		},
	});
	registerCommand("re-graph", {
		description: "Build/show REPI mission attack graph: /re-graph [build|show]",
		handler: async (args: string) => {
			const action = args.trim() === "show" ? "show" : "build";
			deps.sendDisplayMessage(pi, "REPI Attack Graph", deps.buildAttackGraphOutput(action));
		},
	});
}
