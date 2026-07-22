/** Lane command pack builder core. */

import { appendSpecialistRuntimeCommands } from "../lanes/specialist-packs.ts";
import type { MissionLane, MissionState } from "../mission.ts";
import { classifyRepiTarget, shellQuote } from "../target.ts";
import { envBoolean } from "../text.ts";
import { augmentLaneCommandPackFromMap, augmentLaneCommandPackFromMemory, pythonString } from "./helpers.ts";
import { appendLaneDomainCommands } from "./pack-domain.ts";
import { applyReverseDomainLaneCommands } from "./pack-reverse.ts";
import type { LaneCommand, LaneCommandPack } from "./types.ts";

export function laneCommandPack(mission: MissionState, lane: MissionLane, target?: string): LaneCommandPack {
	const domain = mission.route.domain;
	const laneName = lane.name.toLowerCase();
	const commands: LaneCommand[] = [];
	const notes = [
		"先执行最小命令包，记录 stdout/stderr 摘要到 re_evidence；不要一上来全量深扫。",
		"命令失败时先解释错误，再用 re_bootstrap plan/install 或切换等价工具。",
	];
	const caseMemoryMigrations: string[] = [];
	const effectiveTarget = augmentLaneCommandPackFromMap(mission, lane, target, commands, notes);
	const targetArg = effectiveTarget ? shellQuote(effectiveTarget) : "<TARGET>";
	const targetPython = pythonString(effectiveTarget ?? "<TARGET>");
	const urlArg = effectiveTarget ?? "<URL>";
	const targetKind = classifyRepiTarget(effectiveTarget).kind;
	const targetIsDirectory = targetKind === "directory";
	const add = (label: string, command: string, evidence: string) => commands.push({ label, command, evidence });
	const isNativeRoute = domain === "Native reverse";
	const isAndroidRoute = domain === "Mobile / Android";
	const isPwnRoute = domain === "Pwn / exploit";
	const isWebRoute = domain === "Web / API pentest";
	const isJsRoute = domain === "Frontend JS reverse";

	appendLaneDomainCommands({
		laneName,
		isNativeRoute,
		isAndroidRoute,
		isPwnRoute,
		isWebRoute,
		isJsRoute,
		targetIsDirectory,
		effectiveTarget,
		targetArg,
		targetPython,
		urlArg,
		add,
		notes,
	});

	appendSpecialistRuntimeCommands(mission, lane, effectiveTarget, commands, notes);

	if (commands.length === 0) {
		add("generic-map", "pwd; find . -maxdepth 3 -type f | sort | head -200", "generic passive map");
		add(
			"generic-search",
			'rg -n "TODO|secret|token|key|auth|password|flag|license|verify|admin|debug" . 2>/dev/null | head -200',
			"generic interesting strings",
		);
	}

	if (envBoolean("REPI_CONTEXT_MEMORY") === true || envBoolean("REPI_FULL_SURFACE") === true) {
		augmentLaneCommandPackFromMemory(mission, lane, effectiveTarget, commands, notes, caseMemoryMigrations);
	}

	applyReverseDomainLaneCommands(commands, mission, lane);
	return {
		missionId: mission.id,
		lane: lane.name,
		route: domain,
		target: effectiveTarget,
		commands,
		notes,
		caseMemoryMigrations,
	};
}
