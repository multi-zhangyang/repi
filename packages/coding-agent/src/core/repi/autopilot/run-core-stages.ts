/** Autopilot run stages: map/bootstrap/lane-run/auto. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { autoModeDefaults } from "../auto-lane/commands.ts";
import { runAutoLaneChain } from "../auto-lane/run.ts";
import { updateMissionCheckpoint } from "../autopilot-deps.ts";
import {
	autopilotBootstrapPlan,
	autopilotExecutionStrategy,
	formatAutopilotBootstrap,
	formatAutopilotExecutionStrategy,
} from "../autopilot-strategy.ts";
import { applyCaseMemoryLanePlan, formatCaseMemoryLanePlan } from "../case-memory.ts";
import { formatLaneCommandPack } from "../lane-commands/helpers.ts";
import { laneCommandPack } from "../lane-commands/pack.ts";
import { runLaneCommandPack } from "../lane-commands/run.ts";
import { activeLane, readCurrentMission } from "../mission.ts";
import { latestPassiveMapContext, runPassiveMap } from "../passive-map.ts";

export async function runAutopilotMapBootstrapStages(params: {
	pi: ExtensionAPI;
	outputs: string[];
	mission: any;
	lane: any;
	initialPack: any;
	params: {
		lane?: string;
		target?: string;
		mapDepth?: number;
		maxAutoSteps?: number;
		runAuto?: boolean;
		reasoning?: "regex" | "llm";
		dispatch?: "inline" | "specialist";
		cwd?: string;
	};
}): Promise<{
	mappedMission: any;
	mappedLane: any;
	strategy: any;
	pack: any;
}> {
	const { pi, outputs, mission, lane, initialPack } = params;
	const p = params.params;
	outputs.push(`## map\n${await runPassiveMap(pi, { target: p.target ?? initialPack.target, depth: p.mapDepth })}`);
	let mappedMission = readCurrentMission() ?? mission;
	let mappedLane = activeLane(mappedMission, p.lane) ?? lane;
	updateMissionCheckpoint("repro_commands_ready", "done", `autopilot:${mappedLane.name}`);
	let pack = laneCommandPack(mappedMission, mappedLane, p.target ?? initialPack.target);
	const caseMemoryPlan = applyCaseMemoryLanePlan({ mission: mappedMission, lane: mappedLane, pack });
	outputs.push(`## case-memory-lane-plan\n${formatCaseMemoryLanePlan(caseMemoryPlan)}`);
	if (caseMemoryPlan.action !== "none") {
		mappedMission = readCurrentMission() ?? mappedMission;
		mappedLane =
			activeLane(mappedMission, caseMemoryPlan.targetLane ?? caseMemoryPlan.addedLane ?? p.lane) ??
			activeLane(mappedMission) ??
			mappedLane;
		pack = laneCommandPack(mappedMission, mappedLane, p.target ?? initialPack.target);
		updateMissionCheckpoint("repro_commands_ready", "done", `autopilot:${mappedLane.name}:case_memory_lane_plan`);
	}
	const bootstrap = autopilotBootstrapPlan(mappedMission.route, pack, latestPassiveMapContext());
	const strategy = autopilotExecutionStrategy(pack, bootstrap);
	outputs.push(`## bootstrap\n${formatAutopilotBootstrap(bootstrap)}`);
	outputs.push(`## execution-strategy\n${formatAutopilotExecutionStrategy(strategy)}`);
	outputs.push(`## command-pack\n${formatLaneCommandPack(strategy.pack)}`);
	outputs.push(`## lane-run\n${await runLaneCommandPack(pi, strategy.pack, { strategy })}`);
	if (p.runAuto !== false) {
		const auto = autoModeDefaults();
		outputs.push(
			`## run-auto\n${await runAutoLaneChain(pi, {
				lane: undefined,
				target: strategy.pack.target ?? p.target,
				maxSteps: p.maxAutoSteps,
				reasoning: p.reasoning ?? auto.reasoning,
				dispatch: p.dispatch ?? auto.dispatch,
				cwd: p.cwd,
			})}`,
		);
	}
	return { mappedMission, mappedLane, strategy, pack };
}
