/** Specialist lane command pack gate build/format. */
import type { ReLaneSpecialistCommandPackCheckV1 } from "./specialist-pack-matrix.ts";
import { RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX } from "./specialist-pack-matrix.ts";

export function buildReLaneSpecialistCommandPackGate(domainFilter?: string): ReLaneSpecialistCommandPackCheckV1 {
	const selected = domainFilter
		? RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX.filter(
				(row: any) => row.domainId === domainFilter || row.domainId.includes(domainFilter),
			)
		: RE_LANE_SPECIALIST_COMMAND_PACK_MATRIX;
	const rows = selected.map((row: any) => {
		const gaps = [
			row.routeMatchers.length ? undefined : "route_matchers_missing",
			row.laneSeeds.length ? undefined : "lane_seeds_missing",
			row.commandPackMarkers.length >= 3 ? undefined : "command_pack_markers_missing",
			row.analyzerAnchors.length >= 3 ? undefined : "analyzer_anchors_missing",
			row.selfHealCommands.length >= 2 ? undefined : "self_heal_commands_missing",
			row.proofExitBridge.length >= 3 ? undefined : "proof_exit_bridge_missing",
		].filter((item): item is string => Boolean(item));
		return { ...row, status: gaps.length ? ("blocked" as const) : ("ready" as const), gaps };
	});
	return {
		kind: "ReLaneSpecialistCommandPackCheckV1",
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		runtime: "runtime:re_lane-specialist-command-pack",
		domainCount: rows.length,
		readyDomainCount: rows.filter((row: any) => row.status === "ready").length,
		rows,
		closure: {
			allDomainsHaveRouteMatchers: rows.every((row: any) => row.routeMatchers.length > 0),
			allDomainsHaveLaneSeeds: rows.every((row: any) => row.laneSeeds.length > 0),
			allDomainsHaveCommandPacks: rows.every((row: any) => row.commandPackMarkers.length >= 3),
			allDomainsHaveAnalyzerAnchors: rows.every((row: any) => row.analyzerAnchors.length >= 3),
			allDomainsHaveSelfHeal: rows.every((row: any) => row.selfHealCommands.length >= 2),
			allDomainsHaveProofExitBridge: rows.every((row: any) => row.proofExitBridge.length >= 3),
		},
		nextRuntimeCommands: [
			"re_lane_specialist_pack show",
			"re_lane plan <domain-lane> <target>",
			"re_lane run <domain-lane> <target>",
			"re_domain_proof_exit show <domain>",
		],
	};
}

export function formatReLaneSpecialistCommandPackGate(report: ReLaneSpecialistCommandPackCheckV1): string {
	return [
		"relane_specialist_command_pack:",
		"ReLaneSpecialistCommandPackCheckV1: true",
		`runtime: ${report.runtime}`,
		`coverage: domains=${report.domainCount} ready=${report.readyDomainCount}`,
		`closure: route=${report.closure.allDomainsHaveRouteMatchers} lanes=${report.closure.allDomainsHaveLaneSeeds} command_pack=${report.closure.allDomainsHaveCommandPacks} analyzer=${report.closure.allDomainsHaveAnalyzerAnchors} self_heal=${report.closure.allDomainsHaveSelfHeal} proof_exit=${report.closure.allDomainsHaveProofExitBridge}`,
		"domains:",
		...report.rows.flatMap((row: any) => [
			`- domain:${row.domainId} status=${row.status} lane_seeds=${row.laneSeeds.join(",")}`,
			`  route_matchers: ${row.routeMatchers.join(" | ")}`,
			`  command_pack_markers: ${row.commandPackMarkers.join(" | ")}`,
			`  analyzer_anchors: ${row.analyzerAnchors.join(" | ")}`,
			`  self_heal_commands: ${row.selfHealCommands.join(" | ")}`,
			`  proof_exit_bridge: ${row.proofExitBridge.join(" | ")}`,
			`  gaps: ${row.gaps.join(", ") || "none"}`,
		]),
		"next_runtime_commands:",
		...report.nextRuntimeCommands.map((item: any) => `- ${item}`),
	].join("\n");
}
