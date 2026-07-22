/** Auto-lane run chain. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { d } from "./deps.ts";
import { runAutoLaneInlineStep } from "./run-inline-step.ts";
import { tryAutoLaneSpecialistStep } from "./run-specialist-step.ts";
import { formatAutoLaneRunSummary } from "./run-summary.ts";
import type { RunAutoDecision } from "./types.ts";

export async function runAutoLaneChain(
	pi: ExtensionAPI,
	params: {
		lane?: string;
		target?: string;
		maxSteps?: number;
		maxCommandsPerStep?: number;
		reasoning?: "regex" | "llm";
		dispatch?: "inline" | "specialist";
		cwd?: string;
	},
): Promise<string> {
	const maxSteps = Math.min(Math.max(Math.floor(params.maxSteps ?? 2), 1), 5);
	const maxCommandsPerStep = Math.min(Math.max(Math.floor(params.maxCommandsPerStep ?? 3), 1), 6);
	const outputs: string[] = [];
	let stopReason = "max_steps_reached";
	let requestedLane = params.lane;
	const decisions: RunAutoDecision[] = [];
	let caseMemoryPlanApplied = false;
	for (let step = 0; step < maxSteps; step++) {
		const mission = d().readCurrentMission();
		if (!mission) {
			stopReason = "no_active_mission";
			break;
		}
		const lane = d().activeLane(mission, requestedLane);
		requestedLane = undefined;
		if (!lane) {
			stopReason = "no_active_lane";
			break;
		}
		if (!caseMemoryPlanApplied) {
			const memoryPack = d().laneCommandPack(mission, lane, params.target);
			const plan = d().applyCaseMemoryLanePlan({ mission, lane, pack: memoryPack });
			if (plan.action !== "none" || plan.migrations.length > 0) {
				outputs.push(`## case-memory-lane-plan step ${step + 1}\n${d().formatCaseMemoryLanePlan(plan)}`);
				caseMemoryPlanApplied = true;
				if (plan.action !== "none") {
					requestedLane = plan.targetLane ?? plan.addedLane ?? lane.name;
					stopReason = `case_memory_lane_plan:${plan.action}:${requestedLane ?? "none"}`;
					continue;
				}
			}
		}
		if (params.dispatch === "specialist" && params.cwd) {
			const specialist = await tryAutoLaneSpecialistStep({
				pi,
				cwd: params.cwd,
				lane,
				mission,
				target: params.target,
				step,
				maxSteps,
				decisions,
				outputs,
			});
			if (specialist.handled) {
				stopReason = specialist.stopReason;
				if (specialist.stop) break;
				requestedLane = specialist.requestedLane;
				continue;
			}
		}
		const inline = await runAutoLaneInlineStep({
			pi,
			lane,
			mission,
			target: params.target,
			step,
			maxSteps,
			maxCommandsPerStep,
			reasoning: params.reasoning,
			cwd: params.cwd,
			decisions,
			outputs,
		});
		stopReason = inline.stopReason;
		if (inline.stop) break;
		requestedLane = inline.requestedLane;
	}
	return formatAutoLaneRunSummary({
		params,
		maxSteps,
		stepsExecuted: decisions.length,
		stopReason,
		decisions,
		outputs,
	});
}
