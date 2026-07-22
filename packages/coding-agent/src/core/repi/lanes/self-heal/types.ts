import type { LaneCommand } from "../../lane-commands/types.ts";

/** Self-heal types. */
export type LaneCommandPack = {
	missionId?: string;
	lane: string;
	route: string;
	target?: string;
	commands: LaneCommand[];
	notes: string[];
	caseMemoryMigrations: string[];
};

export type SelfHealToolResolvers = {
	commandKnownTools: (command: string) => string[];
};
