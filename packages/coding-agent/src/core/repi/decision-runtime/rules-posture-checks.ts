/** Decision check pressure / evidence / tool / artifact posture. */
/** Decision-core pure rules and posture helpers. */

import type { EvidenceKind } from "../evidence/types.ts";
import { evidenceLedgerPath } from "../storage/paths/evidence-reverse.ts";
import { readTextFile as readText } from "../storage.ts";
import { truncateMiddle } from "../text.ts";
import { bootstrapCatalogFor, contextArtifactIndex, parseToolIndex, recommendedToolsForRoute } from "./deps.ts";

export function decisionCheckPressure(mission: any | undefined): string[] {
	if (!mission) return ["no mission: re_mission new <task>"];
	const ranks = new Map(
		[
			"execution_kernel_ready",
			"decision_core_ready",
			"tool_index_checked",
			"passive_map_done",
			"repro_commands_ready",
			"minimal_path_proven",
			"attack_graph_ready",
			"exploit_chain_ready",
			"operator_queue_ready",
			"verifier_matrix_ready",
			"compiler_ready",
			"replay_ready",
			"autofix_ready",
			"proof_loop_ready",
			"knowledge_graph_ready",
			"report_or_writeup_ready",
			"memory_or_evolution_written",
		].map((checkpoint: any, index: any) => [checkpoint, index + 1]),
	);
	return [...mission.checkpoints]
		.sort((a: any, b: any) => (ranks.get(a.name) ?? 99) - (ranks.get(b.name) ?? 99) || a.name.localeCompare(b.name))
		.map(
			(checkpoint: any) =>
				`${checkpoint.name}: ${checkpoint.status}${checkpoint.note ? ` — ${truncateMiddle(checkpoint.note, 160)}` : ""}`,
		);
}

export function decisionEvidencePriority(): string[] {
	const ledger = readText(evidenceLedgerPath());
	const kinds: EvidenceKind[] = ["runtime", "traffic", "served_asset", "process_config", "artifact", "source", "note"];
	const lines = ledger.split(/\r?\n/);
	const counts = kinds.map(
		(kind: any) => `${kind}: ${lines.filter((line: any) => line.includes(`— ${kind} —`)).length}`,
	);
	const decisive = lines
		.filter((line: any) => /^## .+ — P[1-4] — /.test(line))
		.slice(-8)
		.map((line: any) => line.replace(/^##\s*/, ""));
	return [
		"priority_order: runtime/memory > traffic > served_asset > process_config > artifact > source > note",
		`ledger_counts: ${counts.join(", ")}`,
		...(decisive.length ? decisive.map((item: any) => `decisive: ${item}`) : ["decisive: none yet"]),
	];
}

export function decisionToolPosture(mission: any | undefined): string[] {
	const index = parseToolIndex();
	const recommended = mission
		? recommendedToolsForRoute(mission.route)
		: ["file", "sha256sum", "rg", "python3", "curl"].filter((tool: any) => bootstrapCatalogFor(tool));
	const missing = recommended.filter((tool: any) => !index.get(tool)?.present);
	const present = recommended.filter((tool: any) => index.get(tool)?.present);
	return [
		`tool_index: ${index.size ? `${index.size} indexed` : "empty; refresh required"}`,
		`recommended: ${recommended.join(", ") || "none"}`,
		`present: ${present.join(", ") || "none"}`,
		`missing: ${missing.join(", ") || "none"}`,
		missing.length
			? `tool_next: re_tool_index refresh -> re_bootstrap plan ${missing.slice(0, 8).join(" ")}`
			: "tool_next: use fallback/direct execution",
	];
}

export function decisionArtifactPosture(): string[] {
	const artifacts = contextArtifactIndex();
	const byKind = new Map(artifacts.map((artifact: any) => [artifact.kind, artifact.path]));
	const required = [
		"map",
		"run",
		"attack_graph",
		"exploit_chain",
		"context",
		"operator",
		"verifier",
		"compiler",
		"replayer",
		"autofix",
		"proof_loop",
		"knowledge",
	];
	return required.map((kind: any) => `${kind}: ${byKind.get(kind) ? `ok ${byKind.get(kind)}` : "missing"}`);
}
