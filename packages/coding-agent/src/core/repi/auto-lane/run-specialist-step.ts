/** Auto-lane specialist dispatch step (opt-in). */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { envBoolean, truncateMiddle } from "../text.ts";
import { dispatchLaneSpecialist, formatRunAutoDecision, shouldEscalateAdaptiveDecision } from "./decision.ts";
import { d } from "./deps.ts";
import type { RunAutoDecision } from "./types.ts";

export async function tryAutoLaneSpecialistStep(params: {
	pi: ExtensionAPI;
	cwd: string;
	lane: any;
	mission: any;
	target?: string;
	step: number;
	maxSteps: number;
	decisions: RunAutoDecision[];
	outputs: string[];
}): Promise<
	| { handled: false }
	| {
			handled: true;
			stop: boolean;
			stopReason: string;
			requestedLane?: string;
	  }
> {
	const { pi, cwd, lane, mission, target, step, maxSteps, decisions, outputs } = params;
	if (envBoolean("REPI_AGENT_THREAD")) return { handled: false };
	try {
		const specialist = await dispatchLaneSpecialist({
			cwd,
			lane,
			mission,
			target,
		});
		if (!specialist) return { handled: false };
		let decision = specialist.decision;
		const sections = [
			`## run-auto step ${step + 1}: ${lane.name} (specialist:${specialist.spec})`,
			truncateMiddle(specialist.text, 14000),
			specialist.note,
		];
		const bootstrapClosure = await d().runToolBootstrapClosure(pi, { lane, text: specialist.text });
		if (bootstrapClosure) {
			decision = bootstrapClosure.decision;
			sections.push(`## tool-bootstrap-closure step ${step + 1}\n${bootstrapClosure.text}`);
		}
		decisions.push(decision);
		sections.push(formatRunAutoDecision(decision));
		outputs.push(sections.join("\n"));
		if (shouldEscalateAdaptiveDecision(decisions)) {
			const plan = d().applyAdaptiveMultiLanePlan({ lane, decision, text: specialist.text, target });
			outputs.push(`## multi-lane-planner step ${step + 1}\n${d().formatMultiLanePlan(plan)}`);
			return {
				handled: true,
				stop: true,
				stopReason: `multi_lane_plan:${plan.lane ?? "none"}:${decision.reason}`,
			};
		}
		if (decision.action === "continue_current") {
			return {
				handled: true,
				stop: false,
				requestedLane: decision.nextLane ?? lane.name,
				stopReason:
					step + 1 >= maxSteps ? `max_steps_reached_after:${decision.reason}` : "adaptive_continue_current",
			};
		}
		if (decision.action === "continue_next") {
			return {
				handled: true,
				stop: false,
				requestedLane: decision.nextLane,
				stopReason: step + 1 >= maxSteps ? `max_steps_reached_after:${decision.reason}` : "adaptive_continue_next",
			};
		}
		return { handled: true, stop: true, stopReason: decision.reason };
	} catch (error) {
		outputs.push(
			`## run-auto step ${step + 1}: ${lane.name} (specialist_dispatch_failed: ${truncateMiddle(String((error as Error).message ?? error), 160)} — falling back to inline)`,
		);
		return { handled: false };
	}
}
