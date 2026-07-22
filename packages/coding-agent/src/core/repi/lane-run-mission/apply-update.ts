// Landmark: reverseDomainCaptureNextCommands laneRunMissionReverseNext reverse_next

/** Lane run mission update. */
import { readCurrentMission } from "../mission.ts";
import { truncateMiddle } from "../text.ts";
import { applyLaneRunMissionCheckpoints } from "./apply-update-checkpoints.ts";
import { laneRunMissionReverseNext } from "./apply-update-reverse.ts";
import { writeCurrentMission } from "./deps.ts";
import {
	annotateMissionLane,
	findLaneIndex,
	findLaneIndexByHint,
	followupNextItems,
	significantLaneFindings,
} from "./helpers.ts";
export function applyLaneRunMissionUpdate(params: {
	pack: any;
	analysis: any;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	artifactPath: string;
}): { mission?: any; message: string } {
	const mission = readCurrentMission();
	const critic = params.analysis.critic;
	const note = [
		`last_run exit=${params.result.code}`,
		`quality=${critic.score}`,
		`verdict=${critic.verdict}`,
		params.analysis.nextLane ? `next=${params.analysis.nextLane}` : undefined,
		params.analysis.findings[0],
		`artifact=${params.artifactPath}`,
	]
		.filter(Boolean)
		.join("; ");
	if (!mission) return { message: "auto_lane_update: no active mission" };
	const currentIndex = findLaneIndex(mission, params.pack.lane);
	if (currentIndex < 0) {
		annotateMissionLane(params.pack.lane, note);
		return { mission, message: "auto_lane_update: current lane not found" };
	}
	const targetIndex = findLaneIndexByHint(mission, params.analysis.nextLane);
	const shouldAdvance =
		params.result.code === 0 &&
		critic.score >= 45 &&
		targetIndex >= 0 &&
		targetIndex !== currentIndex &&
		significantLaneFindings(params.analysis);
	const timestamp = new Date().toISOString();
	const followups = followupNextItems(params.analysis);
	const selfHealCurrent = critic.verdict === "weak" || critic.score < 55;
	const lanes = mission.lanes.map((lane: any, index: any) => {
		if (index === currentIndex) {
			const next = [...lane.next];
			if (selfHealCurrent) {
				for (const item of followups) {
					if (!next.includes(item)) next.push(item);
				}
			}
			return {
				...lane,
				status: shouldAdvance && lane.status === "in_progress" ? ("done" as const) : ("in_progress" as const),
				next,
				note: truncateMiddle(note, 500),
				updatedAt: timestamp,
			};
		}
		if (!selfHealCurrent && index === targetIndex) {
			const next = [...lane.next];
			for (const item of followups) {
				if (!next.includes(item)) next.push(item);
			}
			return {
				...lane,
				status: lane.status === "done" ? lane.status : ("in_progress" as const),
				next,
				note: truncateMiddle(`auto_from=${params.pack.lane}; ${note}`, 500),
				updatedAt: timestamp,
			};
		}
		if (shouldAdvance && lane.status === "in_progress") {
			return { ...lane, status: "pending" as const, updatedAt: timestamp };
		}
		return lane;
	});
	const checkpoints = applyLaneRunMissionCheckpoints({
		checkpoints: mission.checkpoints,
		pack: params.pack,
		critic,
		analysis: params.analysis,
		result: params.result,
		followups,
		timestamp,
	});
	const updated = writeCurrentMission({ ...mission, lanes, checkpoints });
	const reverseNext = laneRunMissionReverseNext({
		pack: params.pack,
		analysis: params.analysis,
		mission,
		target: (params as any).target,
	});
	return {
		mission: updated,
		message: shouldAdvance
			? `auto_lane_update: ${params.pack.lane} -> ${updated.lanes[targetIndex]?.name ?? params.analysis.nextLane}${reverseNext.length ? ` | reverse_next=${reverseNext.join(" ; ")}` : ""}`
			: "auto_lane_update: annotated current lane",
	};
}
