/** Autopilot plan/run chain with reverse domain capture stages. */
// Landmark: runAutopilotCore reverse domain capture re_domain_proof_exit run-auto lane-run
import type { ExtensionAPI } from "../../extensions/types.ts";
import { formatMission } from "../autopilot-deps.ts";
import { autopilotBootstrapPlan, autopilotExecutionStrategy } from "../autopilot-strategy.ts";
import { laneCommandPack } from "../lane-commands/pack.ts";
import { caseMemoryLanePlan } from "../memory-stubs.ts";
import { activeLane } from "../mission.ts";
import { latestPassiveMapContext } from "../passive-map.ts";
import { ensureAutopilotMission, prepareAutopilotCleanState } from "./mission.ts";
import { runAutopilotMapBootstrapStages } from "./run-core-stages.ts";
import { finalizeAutopilotRun } from "./run-finalize.ts";
import { formatAutopilotPlan } from "./run-plan.ts";

export async function runAutopilotCore(
	pi: ExtensionAPI,
	params: {
		action?: "plan" | "run";
		task?: string;
		target?: string;
		lane?: string;
		mapDepth?: number;
		maxAutoSteps?: number;
		runAuto?: boolean;
		cleanState?: boolean;
		reasoning?: "regex" | "llm";
		dispatch?: "inline" | "specialist";
		cwd?: string;
	},
): Promise<string> {
	const action = params.action ?? "run";
	const cleanStateSummary = params.cleanState ? prepareAutopilotCleanState(params) : [];
	const mission = ensureAutopilotMission({ task: params.task, target: params.target });
	const lane = activeLane(mission, params.lane);
	if (!lane) return `autopilot_result:\nstatus: blocked\nreason: no active lane\n${formatMission(mission)}`;
	const initialPack = laneCommandPack(mission, lane, params.target);
	const initialCaseMemoryLanePlan = caseMemoryLanePlan(mission, lane, initialPack);
	const initialMap = latestPassiveMapContext();
	const initialBootstrap = autopilotBootstrapPlan(mission.route, initialPack, initialMap);
	const initialStrategy = autopilotExecutionStrategy(initialPack, initialBootstrap);
	if (action === "plan") {
		return formatAutopilotPlan({
			mission,
			lane,
			initialPack,
			initialCaseMemoryLanePlan,
			initialBootstrap,
			initialStrategy,
			target: params.target,
			cleanState: params.cleanState,
			cleanStateSummary,
		});
	}

	const outputs: string[] = [];
	outputs.push(`## mission\n${formatMission(mission)}`);
	const { mappedMission, mappedLane, strategy, pack } = await runAutopilotMapBootstrapStages({
		pi,
		outputs,
		mission,
		lane,
		initialPack,
		params,
	});
	return finalizeAutopilotRun({
		action,
		outputs,
		mappedMission,
		mappedLane,
		strategy,
		pack,
		target: params.target,
		runAuto: params.runAuto,
		cleanState: params.cleanState,
		cleanStateSummary,
	});
}
