/** Playbook mission/lane scoring. */
import { playbookQualityScore } from "./playbooks-metrics.ts";

export function playbookScore(text: string, mission: any, lane: any): number {
	const lower = text.toLowerCase();
	const route = mission.route.domain.toLowerCase();
	const laneName = lane.name.toLowerCase();
	let score = 0;
	if (lower.includes(`route: ${route}`)) score += 4;
	else if (lower.includes(route)) score += 2;
	if (lower.includes(`requested_lane: ${laneName}`)) score += 4;
	else if (lower.includes(laneName)) score += 2;
	for (const token of mission.task
		.toLowerCase()
		.split(/[^a-z0-9\u4e00-\u9fff]+/)
		.filter((item: any) => item.length >= 3)) {
		if (lower.includes(token)) score += 1;
	}
	score += Math.floor(playbookQualityScore(text) / 10);
	return score;
}
