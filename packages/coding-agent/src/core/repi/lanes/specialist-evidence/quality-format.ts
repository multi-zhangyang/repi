/** Specialist evidence quality format/followup helpers. */

import { truncateMiddle } from "../../text.ts";
import type { LaneRunAnalysis } from "./types.ts";

export function significantLaneFindings(analysis: LaneRunAnalysis): boolean {
	const joined = analysis.findings.join("\n");
	return !/no high-signal anchors parsed|tool\/target\/runtime error surfaced/.test(joined);
}
export function followupNextItems(analysis: LaneRunAnalysis): string[] {
	return [...analysis.followups, ...analysis.critic.selfHeal].map((command: any) =>
		truncateMiddle(`[auto:${command.label}] ${command.command} # evidence: ${command.evidence}`, 900),
	);
}
export function formatLaneRunAnalysis(analysis: LaneRunAnalysis): string {
	return [
		"analysis:",
		...analysis.findings.map((finding: any) => `- ${finding}`),
		...(analysis.nextLane ? [`next_lane_hint: ${analysis.nextLane}`] : []),
		"evidence_quality:",
		`score: ${analysis.critic.score}`,
		`verdict: ${analysis.critic.verdict}`,
		...(analysis.critic.deficits.length > 0
			? ["deficits:", ...analysis.critic.deficits.map((deficit: any) => `- ${deficit}`)]
			: ["deficits: none"]),
		...(analysis.followups.length > 0
			? [
					"followup_commands:",
					...analysis.followups.flatMap((command, index) => [
						`## ${index + 1}. ${command.label}`,
						"```bash",
						command.command,
						"```",
						`evidence: ${command.evidence}`,
					]),
				]
			: []),
		...(analysis.critic.selfHeal.length > 0
			? [
					"self_heal_commands:",
					...analysis.critic.selfHeal.flatMap((command, index) => [
						`## ${index + 1}. ${command.label}`,
						"```bash",
						command.command,
						"```",
						`evidence: ${command.evidence}`,
					]),
				]
			: []),
	].join("\n");
}
