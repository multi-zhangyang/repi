/** Format domain proof-exit closure and campaign artifacts. */

import { truncateMiddle } from "../text.ts";
import type { CampaignArtifact, DomainProofExitClosureV1 } from "./types.ts";

export function formatDomainProofExitClosure(report: DomainProofExitClosureV1, path?: string): string {
	return [
		"reverse_runtime_gate=require_partial_or_strong_runtime_capture_and_bind_ready",
		"domain_proof_exit_closure:",
		"DomainProofExitClosureV1: true",
		path ? `artifact: ${path}` : undefined,
		`status: ${report.status}`,
		`domain: ${report.domainId ?? "unmapped"}`,
		`route: ${report.routeDomain ?? "unknown"}`,
		`toolchain_status: ${report.toolchainStatus ?? "unknown"}`,
		`artifact_corpus_sha256: ${report.artifactCorpusHash}`,
		`artifact_sources: ${report.artifactSources.length}`,
		"proof_exit_rows:",
		...(report.rows.length
			? report.rows.flatMap((row: any) => [
					`- proof_exit: ${row.proofExit}`,
					`  status: ${row.status}`,
					`  matched_artifacts: ${row.matchedArtifacts.join(", ") || "none"}`,
					`  matched_lines: ${row.matchedLines.map((line: any) => truncateMiddle(line.replace(/\s+/g, " "), 220)).join(" | ") || "none"}`,
					`  expected_evidence: ${row.expectedEvidence.join(" | ")}`,
					`  next: ${row.nextCommands.slice(0, 5).join(" | ")}`,
				])
			: ["- none"]),
		"missing:",
		...(report.missingProofExits.length ? report.missingProofExits.map((item: any) => `- ${item}`) : ["- none"]),
		"blockers:",
		...(report.blockers.length ? report.blockers.map((item: any) => `- ${item}`) : ["- none"]),
		"next_runtime_commands:",
		...report.nextRuntimeCommands.map((item: any) => `- ${item}`),
	]
		.filter(Boolean)
		.join("\n");
}

export function formatCampaign(campaign: CampaignArtifact, path?: string): string {
	return [
		"campaign_graph:",
		path ? `campaign_artifact: ${path}` : undefined,
		`timestamp: ${campaign.timestamp}`,
		`mission_id: ${campaign.missionId ?? "none"}`,
		`route: ${campaign.route ?? "none"}`,
		`target: ${campaign.target ?? "<none>"}`,
		"phases:",
		...campaign.phases.flatMap((phase: any) => [
			`- ${phase.name} [${phase.status}] route=${phase.route}`,
			`  objective: ${phase.objective}`,
			`  candidate_lanes: ${phase.candidateLanes.length ? phase.candidateLanes.join(", ") : "none"}`,
			`  required_evidence: ${phase.requiredEvidence.join(", ")}`,
			`  next_actions: ${phase.nextActions.join(" | ")}`,
			`  tool_gaps: ${phase.toolGaps.length ? phase.toolGaps.join(", ") : "none"}`,
		]),
		"pivot_candidates:",
		...(campaign.pivots.length ? campaign.pivots.map((item: any) => `- ${item}`) : ["- none"]),
		"evidence_gaps:",
		...(campaign.gaps.length ? campaign.gaps.map((item: any) => `- ${item}`) : ["- none"]),
		"tool_gaps:",
		...(campaign.toolGaps.length ? campaign.toolGaps.map((item: any) => `- ${item}`) : ["- none"]),
		"operator_next_actions:",
		...(campaign.nextActions.length ? campaign.nextActions.map((item: any) => `- ${item}`) : ["- none"]),
		`next_bootstrap_command: ${campaign.nextBootstrapCommand}`,
		"source_artifacts:",
		...(campaign.sourceArtifacts.length ? campaign.sourceArtifacts.map((item: any) => `- ${item}`) : ["- none"]),
	]
		.filter(Boolean)
		.join("\n");
}
