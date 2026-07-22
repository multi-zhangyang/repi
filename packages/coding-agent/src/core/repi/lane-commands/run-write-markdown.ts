/** Lane run artifact markdown body. */
import type { LaneCommand, LaneCommandPack } from "./types.ts";

type LaneRunAnalysis = any;

export function formatLaneRunArtifactMarkdown(params: {
	timestamp: string;
	pack: LaneCommandPack;
	runnable: LaneCommand[];
	script: string;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	analysis: LaneRunAnalysis;
}): string {
	return [
		"# REPI Lane Run Artifact",
		"",
		`timestamp: ${params.timestamp}`,
		`mission_id: ${params.pack.missionId ?? "none"}`,
		`route: ${params.pack.route}`,
		`lane: ${params.pack.lane}`,
		`target: ${params.pack.target ?? "<TARGET>"}`,
		`exit: ${params.result.code}`,
		`killed: ${params.result.killed ? "true" : "false"}`,
		"",
		"## Auto analysis",
		"",
		...params.analysis.findings.map((finding: string) => `- ${finding}`),
		...(params.analysis.nextLane ? [`- next_lane_hint: ${params.analysis.nextLane}`] : []),
		"",
		"## Evidence critic",
		"",
		`score: ${params.analysis.critic.score}`,
		`verdict: ${params.analysis.critic.verdict}`,
		"",
		"deficits:",
		...(params.analysis.critic.deficits.length > 0
			? params.analysis.critic.deficits.map((deficit: string) => `- ${deficit}`)
			: ["- none"]),
		"",
		"## Follow-up commands",
		"",
		...(params.analysis.followups.length > 0
			? params.analysis.followups.map((command: any, index: number) =>
					[
						`### ${index + 1}. ${command.label}`,
						"",
						"```bash",
						command.command,
						"```",
						"",
						`evidence: ${command.evidence}`,
						"",
					].join("\n"),
				)
			: ["No high-confidence follow-up commands parsed.", ""]),
		"## Self-heal commands",
		"",
		...(params.analysis.critic.selfHeal.length > 0
			? params.analysis.critic.selfHeal.map((command: any, index: number) =>
					[
						`### ${index + 1}. ${command.label}`,
						"",
						"```bash",
						command.command,
						"```",
						"",
						`evidence: ${command.evidence}`,
						"",
					].join("\n"),
				)
			: ["No self-heal commands required.", ""]),
		"## Runnable commands",
		"",
		...params.runnable.map((command: any, index: any) =>
			[
				`### ${index + 1}. ${command.label}`,
				"",
				"```bash",
				command.command,
				"```",
				"",
				`evidence: ${command.evidence}`,
				"",
			].join("\n"),
		),
		"## Script",
		"",
		"```bash",
		params.script,
		"```",
		"",
		"## stdout",
		"",
		"```",
		params.result.stdout,
		"```",
		"",
		"## stderr",
		"",
		"```",
		params.result.stderr,
		"```",
		"",
	].join("\n");
}
