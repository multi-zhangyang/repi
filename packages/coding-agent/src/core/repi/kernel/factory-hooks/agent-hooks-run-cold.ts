/** Cold-start lean packet assembly for before_agent_start. */
// Landmark: repi_inject cold-start-lean-v1 buildRepiColdStartPacket

import { getRepiHarnessStartupLines } from "../harness-modes.ts";
import { markMissionColdStart } from "./agent-hooks-sticky.ts";
import { buildRepiColdStartPacket } from "./cold-start.ts";

export function buildRepiColdStartSystemPrompt(args: {
	event: any;
	route: any;
	mission: any;
	prompt: string;
	stats: any;
	activeTools: string[];
	writeCurrentMission: any;
	d: Record<string, any>;
}): { systemPrompt: string } {
	const { event, route, mission, prompt, stats, activeTools, writeCurrentMission, d } = args;
	const packet = buildRepiColdStartPacket({
		route,
		mission,
		prompt,
		stats,
		formatRoute: d.formatRoute,
		techniqueIdsForRoute: d.techniqueIdsForRoute,
		buildMissionDigest: d.buildMissionDigest,
		buildKernelOutput: d.buildKernelOutput,
		buildDecisionCoreOutput: d.buildDecisionCoreOutput,
		buildStartupEvidenceDigest: d.buildStartupEvidenceDigest,
		buildStartupContextDigest: d.buildStartupContextDigest,
		buildToolDigest: d.buildToolDigest,
		truncateMiddle: d.truncateMiddle,
		formatCompletionAudit: d.formatCompletionAudit,
		makeSelfReview: d.makeSelfReview,
	});
	const landmark = "repi_inject: cold-start-lean-v1";
	const harnessLines = getRepiHarnessStartupLines();
	const toolLine = activeTools.length > 0 ? `active_tools: ${activeTools.join(", ")}` : "";
	const harnessBlock = [...harnessLines, toolLine].filter(Boolean).join("\n");
	const fullPacket = harnessBlock ? `${landmark}\n${packet}\n\n${harnessBlock}` : `${landmark}\n${packet}`;
	stats.selfReviewDue = false;
	stats.selfReviewNotified = false;
	stats.coldStartInjected = true;
	stats.coldStartRouteDomain = route.domain;
	markMissionColdStart(writeCurrentMission, mission, route);
	return { systemPrompt: `${event.systemPrompt}\n\n${fullPacket}` };
}
