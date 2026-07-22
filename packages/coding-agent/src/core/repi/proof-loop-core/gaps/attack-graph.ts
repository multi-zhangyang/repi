import { existsSync } from "node:fs";
/** Proof-loop attack-graph gap collection. */
import type { RepiProofLoopGapItem as ProofLoopGapItem } from "../../proof-loop/types.ts";
import { artifactTargetMatches } from "../../replayer-runtime/deps.ts";
import type { RuntimeAdapterExecutionArtifactV1 } from "../../runtime-adapter/types.ts";
import { readJsonObjectFile } from "../../storage/io/json.ts";
import {
	latestAttackGraphArtifactPath,
	parseAttackGraphArtifact,
	runtimeAdapterMitigationEvidenceForGraph,
	runtimeAdapterParserSummaryForGraph,
} from "../deps.ts";

export function proofLoopAttackGraphGapItems(target?: string): Array<Omit<ProofLoopGapItem, "worker">> {
	const scope = target ? { target, requestedBy: "proof_loop_attack_graph_gap_consumer" } : {};
	const path = latestAttackGraphArtifactPath(scope) ?? latestAttackGraphArtifactPath();
	if (!path) {
		return [
			{
				source: "attack_graph",
				text: "attack graph artifact missing: run re_graph build before proof-loop planning",
				sourceArtifacts: [],
			},
		];
	}
	const graph = parseAttackGraphArtifact(path);
	if (!graph) {
		return [
			{
				source: "attack_graph",
				text: `attack graph artifact unreadable: ${path}`,
				sourceArtifacts: [path],
			},
		];
	}
	if (target && graph.target && !artifactTargetMatches(target, graph.target)) return [];
	const sourceArtifacts = [path, ...(graph.sourceArtifacts ?? [])]
		.filter((item: any) => existsSync(item))
		.slice(0, 16);
	const runtimeAdapterGapRows = sourceArtifacts.flatMap((artifactPath: any) => {
		if (!/\/runtime-adapters\/.+\.json$/i.test(artifactPath)) return [];
		try {
			const artifact = readJsonObjectFile<Partial<RuntimeAdapterExecutionArtifactV1>>(artifactPath);
			if (!artifact || artifact.kind !== "RuntimeAdapterExecutionArtifactV1" || !artifact.adapterId) return [];
			const canSummarize =
				Array.isArray(artifact.parserSignals) &&
				Array.isArray(artifact.artifactKinds) &&
				Array.isArray(artifact.ingestTargets) &&
				Array.isArray(artifact.proofExitSignals);
			const typedArtifact = canSummarize
				? (artifact as RuntimeAdapterExecutionArtifactV1 & { stdoutHead?: string; stderrHead?: string })
				: undefined;
			const summary = typedArtifact
				? runtimeAdapterParserSummaryForGraph(typedArtifact)
				: artifact.parserSignalSummary;
			const missing = summary?.missingProofExitSignals ?? [];
			const matched = summary?.matchedProofExitSignals ?? [];
			const rows: string[] = [];
			if (summary && missing.length > 0) {
				rows.push(
					`attack_graph runtime_adapter_gap: parser_signal_summary adapter=${artifact.adapterId} matched=${matched.join(" | ") || "<none>"} missing=${missing.join(" | ") || "<none>"} rules=${summary.matchedRules}/${summary.totalRules} artifact=${artifactPath}`,
				);
				rows.push(
					`attack_graph runtime_adapter_gap: runtime adapter missing proof: ${artifact.adapterId}: ${missing.join("; ")}`,
				);
			}
			if (summary && missing.length === 0 && matched.length > 0 && (artifact.proofExitSignals?.length ?? 0) > 0) {
				rows.push(
					`attack_graph proof_spine_seed: runtime adapter proof-exit complete adapter=${artifact.adapterId} matched=${matched.join(" | ")} rules=${summary.matchedRules}/${summary.totalRules} artifact=${artifactPath}`,
				);
			}
			if ((summary?.matchedRules ?? 0) === 0)
				rows.push(`attack_graph runtime_adapter_gap: runtime adapter parser no-match: ${artifact.adapterId}`);
			if (typedArtifact) {
				const mitigationEvidence = runtimeAdapterMitigationEvidenceForGraph(typedArtifact);
				if (mitigationEvidence?.matched) {
					rows.push(
						`attack_graph proof_spine_seed: binary mitigation map matched: ${artifact.adapterId}: ${mitigationEvidence.evidence.slice(0, 6).join(" | ")}`,
					);
				} else if (mitigationEvidence?.expected) {
					rows.push(
						`attack_graph runtime_adapter_gap: runtime adapter missing mitigation map proof: ${artifact.adapterId}`,
					);
				}
			}
			return rows;
		} catch {
			return [];
		}
	});
	const rows = [
		...runtimeAdapterGapRows,
		...(graph.gaps ?? []).map((gap: any) => `attack_graph gap: ${gap}`),
		...(graph.taskTree ?? [])
			.filter((node: any) => node.kind === "gap")
			.map(
				(node: any) =>
					`attack_graph task_tree_gap: ${node.label} status=${node.status ?? "gap"} evidence=${(node.evidence ?? []).join(" | ") || "none"}`,
			),
		...(graph.taskTree ?? [])
			.filter(
				(node: any) =>
					node.kind === "artifact" && /binary mitigation map/i.test(`${node.label} ${node.status ?? ""}`),
			)
			.map(
				(node: any) =>
					`attack_graph proof_spine_seed: ${node.label} status=${node.status ?? "unknown"} evidence=${(node.evidence ?? []).join(" | ") || "none"}`,
			),
		...(graph.taskTree ?? [])
			.filter((node: any) => node.kind === "parser_summary" && /missing=(?!0\b)/i.test(node.status ?? ""))
			.map(
				(node: any) =>
					`attack_graph parser_signal_summary: ${node.label} status=${node.status ?? "unknown"} evidence=${(node.evidence ?? []).join(" | ") || "none"}`,
			),
	];
	return Array.from(new Set(rows))
		.slice(0, 16)
		.map((text: any) => ({ source: "attack_graph" as const, text, sourceArtifacts }));
}
