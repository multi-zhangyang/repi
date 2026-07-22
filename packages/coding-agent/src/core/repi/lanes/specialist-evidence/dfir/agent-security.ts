/** Specialist evidence analyzer: agent-security. */
import type { LaneCommandPack } from "../../../lane-commands/types.ts";
import { packHasSpecialistSignal } from "../../self-heal.ts";
import type { SpecialistEvidenceAnalysis } from "../types.ts";
import { collectAgentSecuritySignals } from "./agent-security-collect.ts";
import { agentSecurityRerunFollowups, agentSecurityReverseFollowups } from "./agent-security-reverse.ts";

export function analyzeAgentSecurityEvidence(
	pack: LaneCommandPack,
	combined: string,
	targetArg: string,
): SpecialistEvidenceAnalysis {
	const enabled =
		/agent|llm/.test(pack.route.toLowerCase()) ||
		packHasSpecialistSignal(pack, /agent-(prompt|tool|memory|injection|delegation)|agent prompt\/tool boundary/i);
	if (!enabled) return { findings: [], followups: [] };
	const findings: string[] = [];
	const followups: any[] = [];
	const signals = collectAgentSecuritySignals(combined, findings);
	const { promptLines, toolLines, memoryLines, replayLines, delegationLines } = signals;
	if (
		promptLines.length > 0 ||
		toolLines.length > 0 ||
		memoryLines.length > 0 ||
		replayLines.length > 0 ||
		delegationLines.length > 0
	) {
		followups.push(...agentSecurityRerunFollowups(targetArg));
	}
	agentSecurityReverseFollowups({ combined, targetArg, findings, followups });
	return {
		findings,
		followups,
		nextLane:
			replayLines.length > 0 || delegationLines.length > 0
				? "delegation/report"
				: toolLines.length > 0
					? "injection/delegation"
					: promptLines.length > 0 || memoryLines.length > 0
						? "tool-boundary/injection"
						: undefined,
	};
}
