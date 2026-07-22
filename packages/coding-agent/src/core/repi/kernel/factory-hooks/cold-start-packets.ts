/** Lean/full cold-start packet body builders. */
// Landmark: reverseColdStartNextLines proof.exit bind_ready re_domain_proof_exit re_complete audit

import { reverseColdStartNextLines } from "./cold-start-reverse.ts";
import type { RepiColdStartInput } from "./cold-start-types.ts";

export { reverseColdStartNextLines } from "./cold-start-reverse.ts";
export type { RepiColdStartInput } from "./cold-start-types.ts";

export function buildRepiColdStartFullPacket(input: RepiColdStartInput & { includeNarrativePacket: boolean }): string {
	const {
		route,
		prompt,
		stats,
		formatRoute,
		buildMissionDigest,
		buildKernelOutput,
		buildDecisionCoreOutput,
		buildStartupEvidenceDigest,
		buildStartupContextDigest,
		buildToolDigest,
		truncateMiddle,
		formatCompletionAudit,
		makeSelfReview,
		includeNarrativePacket,
	} = input;
	const reverseNext = reverseColdStartNextLines();
	const narrativeBlocks = includeNarrativePacket
		? [
				"",
				"Execution kernel:",
				buildKernelOutput("build", { target: prompt }),
				"",
				"Decision core:",
				buildDecisionCoreOutput("tick", { target: prompt }),
			]
		: ["", "narrative_packet: skipped (set REPI_COLD_START_NARRATIVE=1 to inject re_kernel/re_decision digests)"];
	return [
		"## REPI Runtime Packet",
		formatRoute(route),
		`skill_hint: ${route.skillHint}`,
		"workflow:",
		...route.workflow.map((step: string) => `- ${step}`),
		"",
		"Mission blackboard:",
		buildMissionDigest(),
		...narrativeBlocks,
		"",
		"Evidence ledger tail:",
		buildStartupEvidenceDigest({ target: prompt }),
		"",
		"Context/resume pack:",
		buildStartupContextDigest({ route: route.domain, target: prompt }),
		"",
		"Tool index digest:",
		truncateMiddle(buildToolDigest(), 1200),
		"",
		"Completion checkpoint audit:",
		formatCompletionAudit(),
		"",
		"Execution constraints:",
		"- Start with passive mapping and one live path proof.",
		"- Record decisive evidence in one block.",
		"- If failures or repetition appear, change method instead of repeating.",
		"- Before claiming completion, satisfy or explicitly explain every re_complete checkpoint.",
		...reverseNext,
		stats.selfReviewDue ? makeSelfReview(stats) : "",
	]
		.filter(Boolean)
		.join("\n");
}

export function buildRepiColdStartLeanPacket(input: RepiColdStartInput): string {
	const { route, mission, stats, formatRoute, techniqueIdsForRoute, makeSelfReview } = input;
	const techniqueIds = (typeof techniqueIdsForRoute === "function" ? techniqueIdsForRoute(route) : []).slice(0, 8);
	const reverseNext = reverseColdStartNextLines();
	const workflow = Array.isArray(route?.workflow) ? route.workflow : [];
	const skillHint = route?.skillHint || `${route?.domain || "repi"}.lean`;
	return [
		"## REPI Cold Start (lean)",
		"repi_inject: cold-start-lean-v1",
		formatRoute(route),
		`skill_hint: ${skillHint}`,
		`mission_id: ${mission.id}`,
		techniqueIds.length
			? `technique_ids: ${techniqueIds.join(", ")} (re_techniques show <id>)`
			: "technique_ids: (none — re_route domain has no mapped advanced techniques)",
		"workflow:",
		...(workflow.length > 0
			? workflow.slice(0, 6).map((step: string) => `- ${step}`)
			: ["- re_map <target>", "- live proof path", "- re_domain_proof_exit show"]),
		"next:",
		"- re_map <target> then one live proof path (re_native_runtime / re_live_browser / re_js_signing / re_web_authz_state / re_lane run)",
		"- re_evidence append for decisive runtime/traffic/artifact facts only",
		...reverseNext,
		"- Load domain skill/prompt only when needed; do not dump reference manuals into context",
		"- harness: /plan for read-only recon; /permission default|plan|acceptEdits|bypass; tools activate by route",
		stats.selfReviewDue ? makeSelfReview(stats) : "",
	]
		.filter(Boolean)
		.join("\n");
}
