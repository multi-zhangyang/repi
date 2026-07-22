/** Mission format/digest/route helpers. */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { formatRepiRoute, routeRepiTask } from "../routes.ts";
import { truncateMiddle } from "../text.ts";
import { readCurrentMission } from "./io-read-write.ts";
import { formatLaneQueue } from "./lanes.ts";
import type { MissionState } from "./types.ts";

export function formatMission(mission: MissionState): string {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
			`${mission.route?.domain ?? ""} ${mission.task ?? ""}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${mission.route?.domain ?? ""} ${mission.task ?? ""}`,
				target: mission.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	return [
		`mission_id: ${mission.id}`,
		`task: ${mission.task}`,
		formatRepiRoute(mission.route),
		formatLaneQueue(mission),
		"checkpoints:",
		...mission.checkpoints.map(
			(checkpoint) => `- [${checkpoint.status}] ${checkpoint.name}${checkpoint.note ? ` — ${checkpoint.note}` : ""}`,
		),
		...(reverseNext.length ? ["reverse_next:", ...reverseNext.map((cmd: any) => `- ${cmd}`)] : []),
	].join("\n");
}

export function routeReconTask(task: string) {
	return routeRepiTask(task);
}

export function buildMissionDigest(): string {
	const mission = readCurrentMission();
	return mission
		? truncateMiddle(formatMission(mission), 5000)
		: "无 active mission；调用 re_mission new 创建任务黑板。";
}
