/** Apply case-memory lane plan. */

import { caseMemoryLanePlan, findLaneIndex, upsertMissionCheckpoint, writeCurrentMission } from "./case-memory-deps.ts";
import { readCurrentMission } from "./mission.ts";
import { truncateMiddle } from "./text.ts";

export function applyCaseMemoryLanePlan(params: { mission: any; lane: any; pack: any }): any {
	const plan = caseMemoryLanePlan(params.mission, params.lane, params.pack);
	if (plan.action === "none") return plan;

	const mission = readCurrentMission() ?? params.mission;
	const timestamp = new Date().toISOString();
	const targetLane = plan.targetLane ?? plan.addedLane ?? params.lane.name;
	const mergeNext = (lane: any): string[] => {
		const next = [...lane.next];
		for (const item of plan.next) {
			if (!next.includes(item)) next.push(item);
		}
		return next;
	};
	let lanes: any[];
	if (plan.action === "added") {
		const currentIndex = findLaneIndex(mission, params.lane.name);
		const insertAfter = currentIndex >= 0 ? currentIndex + 1 : 0;
		const plannerLane: any = {
			name: targetLane,
			objective: /^compact_resume_/i.test(plan.reason)
				? "从 compact_resume_case_memory 恢复 compact 后上下文、operator、proof-loop 链路，闭合 queued/blocked 恢复命令后再恢复主线"
				: "从 knowledge_graph case_memory_migrations 迁移高价值 worker/playbook/command strategy，先修复证据面再恢复主线",
			next: plan.next,
			status: "in_progress",
			note: truncateMiddle(`case_memory_lane_plan=added; source=${params.lane.name}; reason=${plan.reason}`, 500),
			updatedAt: timestamp,
		};
		const withoutPlanner = mission.lanes.filter((lane: any) => lane.name !== targetLane);
		withoutPlanner.splice(Math.min(insertAfter, withoutPlanner.length), 0, plannerLane);
		lanes = withoutPlanner.map((lane: any) => {
			if (lane.name === plannerLane.name) return lane;
			if (lane.name === params.lane.name) {
				return {
					...lane,
					status: "pending" as const,
					note: truncateMiddle(
						`case_memory_lane_plan=handoff; target=${plannerLane.name}; reason=${plan.reason}`,
						500,
					),
					updatedAt: timestamp,
				};
			}
			if (lane.status === "in_progress") return { ...lane, status: "pending" as const, updatedAt: timestamp };
			return lane;
		});
	} else {
		lanes = mission.lanes.map((lane: any) => {
			if (lane.name === targetLane) {
				return {
					...lane,
					status: "in_progress" as const,
					next: mergeNext(lane),
					note: truncateMiddle(`case_memory_lane_plan=${plan.action}; reason=${plan.reason}`, 500),
					updatedAt: timestamp,
				};
			}
			if (plan.skippedLane && lane.name === plan.skippedLane) {
				return {
					...lane,
					status: "pending" as const,
					note: truncateMiddle(`case_memory_lane_plan=skipped; target=${targetLane}; reason=${plan.reason}`, 500),
					updatedAt: timestamp,
				};
			}
			if (lane.name === params.lane.name && targetLane !== params.lane.name) {
				return {
					...lane,
					status: "pending" as const,
					note: truncateMiddle(`case_memory_lane_plan=handoff; target=${targetLane}; reason=${plan.reason}`, 500),
					updatedAt: timestamp,
				};
			}
			if (lane.status === "in_progress") return { ...lane, status: "pending" as const, updatedAt: timestamp };
			return lane;
		});
	}
	const checkpoints = upsertMissionCheckpoint(
		mission.checkpoints,
		"memory_checked",
		"done",
		`case_memory_lane_plan:${plan.action}:${targetLane}`,
	);
	writeCurrentMission({ ...mission, lanes, checkpoints });
	return plan;
}
