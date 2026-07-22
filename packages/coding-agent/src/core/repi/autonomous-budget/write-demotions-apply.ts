/** Apply autonomous budget demotions. */

import type { MissionLane } from "../mission.ts";
import type { AutonomousExecutionBudget } from "../operator-format.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { truncateMiddle } from "../text.ts";
import { activeLane, readCurrentMission, updateMissionCheckpoint, writeCurrentMission } from "./deps.ts";

export function applyAutonomousBudgetDemotions(budget: AutonomousExecutionBudget, source?: string): string[] {
	if (!budget.laneDemotions.length) return [];
	const mission = readCurrentMission();
	const active = mission ? activeLane(mission) : undefined;
	if (!mission || !active || active.name === "autonomous-dispatcher-repair") return [];
	if (/autonomous_budget_demoted/i.test(active.note ?? "")) return [];
	const timestamp = new Date().toISOString();
	const repairLaneName = "autonomous-dispatcher-repair";
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${budget.laneDemotions.join(" ")} ${source ?? ""} ${JSON.stringify(budget.nextActions ?? [])}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${source ?? ""} autonomous_budget_demotion`,
				includeGates: true,
			}).slice(0, 3)
		: [];
	const repairNext = Array.from(
		new Set([
			...reverseNext,
			...budget.nextActions,
			...budget.demotionRules.flatMap((row: any) => row.match(/re[-_][\w-]+(?:\s+[^\s;&|]+){0,5}/gi) ?? []),
			"re_context pack",
			"re_operator dispatch <target> 1",
			"re_proof_loop run <target> 4 2",
		]),
	).slice(0, 16);
	const existing = mission.lanes.find((lane: any) => lane.name === repairLaneName);
	let lanes: MissionLane[];
	if (existing) {
		lanes = mission.lanes.map((lane: any) => {
			if (lane.name === repairLaneName) {
				return {
					...lane,
					status: "in_progress" as const,
					next: Array.from(new Set([...lane.next, ...repairNext])).slice(0, 24),
					note: truncateMiddle(`autonomous_budget_repair; source=${active.name}; ${budget.laneDemotions[0]}`, 500),
					updatedAt: timestamp,
				};
			}
			if (lane.name === active.name) {
				return {
					...lane,
					status: "pending" as const,
					note: truncateMiddle(
						`autonomous_budget_demoted; repair_lane=${repairLaneName}; source=${source ?? "budget"}`,
						500,
					),
					updatedAt: timestamp,
				};
			}
			if (lane.status === "in_progress") return { ...lane, status: "pending" as const, updatedAt: timestamp };
			return lane;
		});
	} else {
		const currentIndex = mission.lanes.findIndex((lane: any) => lane.name === active.name);
		const repairLane: MissionLane = {
			name: repairLaneName,
			objective: "跨 turn autonomous budget 发现 dispatcher/worker/lane 重复低效，先降级旧路线并修复调度证据闭环",
			next: repairNext,
			status: "in_progress",
			note: truncateMiddle(`autonomous_budget_added; source=${active.name}; ${budget.laneDemotions[0]}`, 500),
			updatedAt: timestamp,
		};
		lanes = mission.lanes.map((lane: any) => {
			if (lane.name === active.name) {
				return {
					...lane,
					status: "pending" as const,
					note: truncateMiddle(
						`autonomous_budget_demoted; repair_lane=${repairLaneName}; source=${source ?? "budget"}`,
						500,
					),
					updatedAt: timestamp,
				};
			}
			if (lane.status === "in_progress") return { ...lane, status: "pending" as const, updatedAt: timestamp };
			return lane;
		});
		lanes.splice(Math.max(0, currentIndex + 1), 0, repairLane);
	}
	writeCurrentMission({ ...mission, lanes, updatedAt: timestamp });
	updateMissionCheckpoint("autonomous_budget_ready", "done", source ?? budget.ledgerPath ?? "autonomous-budget");
	return budget.laneDemotions;
}
