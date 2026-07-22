/** Shared self-heal domain context. */
import type { LaneCommand } from "../../specialist-packs.ts";
import type { LaneCommandPack } from "../types.ts";

export type SelfHealCtx = {
	pack: LaneCommandPack;
	result: { code: number; stdout: string; stderr: string; killed?: boolean };
	findings: string[];
	deficits: string[];
	route: string;
	combined: string;
	target?: string;
	add: (label: string, command: string, evidence: string) => void;
	toolNames: LaneCommand[];
};
