/** Decision / multi-lane exit after an inline pack run. */

import { shouldEscalateAdaptiveDecision } from "./decision.ts";
import { d } from "./deps.ts";
import type { RunAutoDecision } from "./types.ts";

export function resolveAutoLaneInlineDecision(params: {
	lane: any;
	decision: RunAutoDecision;
	text: string;
	target?: string;
	step: number;
	maxSteps: number;
	decisions: RunAutoDecision[];
	outputs: string[];
}): { stop: boolean; stopReason: string; requestedLane?: string } {
	const { lane, decision, text, target, step, maxSteps, decisions, outputs } = params;
	if (shouldEscalateAdaptiveDecision(decisions)) {
		const plan = d().applyAdaptiveMultiLanePlan({ lane, decision, text, target });
		outputs.push(`## multi-lane-planner step ${step + 1}\n${d().formatMultiLanePlan(plan)}`);
		return {
			stop: true,
			stopReason: `multi_lane_plan:${plan.lane ?? "none"}:${decision.reason}`,
		};
	}
	if (decision.action === "continue_current") {
		return {
			stop: false,
			requestedLane: decision.nextLane ?? lane.name,
			stopReason: step + 1 >= maxSteps ? `max_steps_reached_after:${decision.reason}` : "adaptive_continue_current",
		};
	}
	if (decision.action === "continue_next") {
		return {
			stop: false,
			requestedLane: decision.nextLane,
			stopReason: step + 1 >= maxSteps ? `max_steps_reached_after:${decision.reason}` : "adaptive_continue_next",
		};
	}
	if (/^tool_bootstrap_/.test(decision.reason)) {
		return { stop: true, stopReason: decision.reason };
	}
	const plan = d().applyAdaptiveMultiLanePlan({ lane, decision, text, target });
	outputs.push(`## multi-lane-planner step ${step + 1}\n${d().formatMultiLanePlan(plan)}`);
	return {
		stop: true,
		stopReason:
			plan.action === "none" ? decision.reason : `multi_lane_plan:${plan.lane ?? "none"}:${decision.reason}`,
	};
}
