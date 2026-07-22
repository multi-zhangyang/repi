/** Auto-lane command pack + lane command helpers. */

import type { LaneCommand, LaneCommandPack } from "../lane-commands.ts";
import type { MissionLane, MissionState } from "../mission.ts";
import { seedReverseAutoLaneCommands } from "./commands-pack-reverse.ts";

export { autoCommandsForLane, parseAutoLaneCommand } from "./commands-pack-parse.ts";

export function autoLaneCommandPack(
	mission: MissionState,
	lane: MissionLane,
	commands: LaneCommand[],
	target?: string,
): LaneCommandPack {
	const pack: LaneCommandPack = {
		missionId: mission.id,
		lane: lane.name,
		route: mission.route.domain,
		target,
		commands: [...commands],
		notes: [
			"run-auto 执行上一轮 analysis 挂载的 [auto:*] follow-up commands。",
			"每步执行后继续写 evidence artifact、解析输出并更新 mission lane。",
		],
		caseMemoryMigrations: [],
	};
	seedReverseAutoLaneCommands(mission, lane, pack, target);
	return pack;
}
