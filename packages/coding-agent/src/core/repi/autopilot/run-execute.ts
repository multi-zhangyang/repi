/** Autopilot strategy execute stage (bootstrap → lane-run → optional auto). */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { autoModeDefaults } from "../auto-lane/commands.ts";
import { runAutoLaneChain } from "../auto-lane/run.ts";
import { formatAutopilotBootstrap, formatAutopilotExecutionStrategy } from "../autopilot-strategy.ts";
import { formatLaneCommandPack } from "../lane-commands/helpers.ts";
import { runLaneCommandPack } from "../lane-commands/run.ts";
import { finalizeAutopilotRun } from "./run-finalize.ts";

export async function executeAutopilotStrategy(
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
	ctx: {
		outputs: string[];
		mappedMission: any;
		mappedLane: any;
		strategy: any;
		pack: any;
		bootstrap: any;
		action: string;
		cleanStateSummary: string[];
	},
): Promise<string> {
	const { outputs, mappedMission, mappedLane, strategy, pack, bootstrap, action, cleanStateSummary } = ctx;

	outputs.push(`## bootstrap\n${formatAutopilotBootstrap(bootstrap)}`);
	outputs.push(`## execution-strategy\n${formatAutopilotExecutionStrategy(strategy)}`);
	outputs.push(`## command-pack\n${formatLaneCommandPack(strategy.pack)}`);
	outputs.push(`## lane-run\n${await runLaneCommandPack(pi, strategy.pack, { strategy })}`);

	if (params.runAuto !== false) {
		const auto = autoModeDefaults();
		outputs.push(
			`## run-auto\n${await runAutoLaneChain(pi, {
				lane: undefined,
				target: strategy.pack.target ?? params.target,
				maxSteps: params.maxAutoSteps,
				reasoning: params.reasoning ?? auto.reasoning,
				dispatch: params.dispatch ?? auto.dispatch,
				cwd: params.cwd,
			})}`,
		);
	}

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
