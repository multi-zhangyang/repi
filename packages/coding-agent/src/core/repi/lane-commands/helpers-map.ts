/** Augment lane command pack from passive map. */

import type { MissionLane, MissionState } from "../mission.ts";
import { shellQuote } from "../target.ts";
import { truncateMiddle } from "../text.ts";
import { inferTargetFromMap, latestPassiveMapContext } from "./deps.ts";
import type { LaneCommand } from "./types.ts";

export function augmentLaneCommandPackFromMap(
	mission: MissionState,
	_lane: MissionLane,
	target: string | undefined,
	commands: LaneCommand[],
	notes: string[],
): string | undefined {
	const map = latestPassiveMapContext();
	if (!map) {
		notes.push("map_reuse: none; run re_map [target] [depth] before broad execution to anchor passive evidence.");
		return target;
	}
	const inferredTarget = target ?? inferTargetFromMap(map, mission);
	notes.push(
		[
			`map_reuse: ${map.path}`,
			`timestamp=${map.timestamp}`,
			map.target ? `map_target=${map.target}` : undefined,
			map.signals.length
				? `signals=${map.signals
						.slice(0, 6)
						.map((signal: any) => truncateMiddle(signal, 140))
						.join(" | ")}`
				: "signals=none",
		]
			.filter(Boolean)
			.join("; "),
	);
	if (!target && inferredTarget) notes.push(`map_inferred_target: ${inferredTarget}`);
	if (map.candidates.length > 0) {
		notes.push(`map_binary_candidates: ${map.candidates.slice(0, 8).join(", ")}`);
	}
	if (!commands.some((command: any) => command.label === "map-artifact-context")) {
		commands.unshift({
			label: "map-artifact-context",
			command: `sed -n '1,180p' ${shellQuote(map.path)}`,
			evidence: "latest passive map artifact context",
		});
	}
	for (const candidate of map.candidates.slice(0, 3)) {
		const command = `file ${shellQuote(candidate)} && sha256sum ${shellQuote(candidate)}`;
		if (!commands.some((item: any) => item.command === command)) {
			commands.push({
				label: "map-candidate-hash",
				command,
				evidence: `candidate from passive map ${map.path}`,
			});
		}
	}
	return inferredTarget;
}
