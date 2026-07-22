/** Auto-lane command parse helpers. */

import type { LaneCommand } from "../lane-commands.ts";
import type { MissionLane } from "../mission.ts";

export function parseAutoLaneCommand(item: string): LaneCommand | undefined {
	const match = /^\[auto:([^\]]+)]\s+([\s\S]*?)(?:\s+# evidence:\s*([\s\S]*))?$/.exec(item.trim());
	if (!match) return undefined;
	return {
		label: match[1]?.trim() || "auto-followup",
		command: match[2]?.trim() || "",
		evidence: match[3]?.trim() || "auto follow-up command",
	};
}

export function autoCommandsForLane(
	lane: MissionLane,
	maxCommands: number,
): { commands: LaneCommand[]; rawItems: string[] } {
	const commands: LaneCommand[] = [];
	const rawItems: string[] = [];
	for (const item of lane.next) {
		const parsed = parseAutoLaneCommand(item);
		if (!parsed || !parsed.command) continue;
		commands.push(parsed);
		rawItems.push(item);
		if (commands.length >= maxCommands) break;
	}
	return { commands, rawItems };
}
