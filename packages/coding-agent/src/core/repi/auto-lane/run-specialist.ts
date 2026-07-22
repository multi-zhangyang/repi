/** Auto-lane specialist dispatch path. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { envBoolean, truncateMiddle } from "../text.ts";
import { dispatchLaneSpecialist, formatRunAutoDecision, shouldEscalateAdaptiveDecision } from "./decision.ts";
import { d } from "./deps.ts";
import type { RunAutoDecision } from "./types.ts";

export type { SpecialistDispatchResult } from "./run-specialist-result.ts";

import {
	type SpecialistDispatchResult,
	specialistHandledContinue,
	specialistHandledStop,
} from "./run-specialist-result.ts";

export async function tryAutoLaneSpecialistDispatch(input: {
	pi: ExtensionAPI;
	params: { target?: string; cwd?: string; dispatch?: "inline" | "specialist" };
	lane: any;
	mission: any;
	step: number;
	maxSteps: number;
	decisions: RunAutoDecision[];
}): Promise<SpecialistDispatchResult> {
	const { pi, params, lane, mission, step, maxSteps, decisions } = input;
	if (!(params.dispatch === "specialist" && params.cwd && !envBoolean("REPI_AGENT_THREAD"))) {
		return { kind: "none" };
	}
	const outputs: string[] = [];
	try {
		const specialist = await dispatchLaneSpecialist({
			cwd: params.cwd,
			lane,
			mission,
			target: params.target,
		});
		if (!specialist) return { kind: "none" };
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
		const nextDecisions = [...decisions, decision];
		sections.push(formatRunAutoDecision(decision));
		outputs.push(sections.join("\n"));
		if (shouldEscalateAdaptiveDecision(nextDecisions)) {
			const plan = d().applyAdaptiveMultiLanePlan({
				lane,
				decision,
				text: specialist.text,
				target: params.target,
			});
			outputs.push(`## multi-lane-planner step ${step + 1}\n${d().formatMultiLanePlan(plan)}`);
			return specialistHandledStop({
				outputs,
				decisions: nextDecisions,
				stopReason: `multi_lane_plan:${plan.lane ?? "none"}:${decision.reason}`,
			});
		}
		if (decision.action === "continue_current") {
			return specialistHandledContinue({
				outputs,
				decisions: nextDecisions,
				decision,
				laneName: lane.name,
				step,
				maxSteps,
				kind: "continue_current",
			});
		}
		if (decision.action === "continue_next") {
			return specialistHandledContinue({
				outputs,
				decisions: nextDecisions,
				decision,
				laneName: lane.name,
				step,
				maxSteps,
				kind: "continue_next",
			});
		}
		return specialistHandledStop({
			outputs,
			decisions: nextDecisions,
			stopReason: decision.reason,
		});
	} catch (error) {
		outputs.push(
			`## run-auto step ${step + 1}: ${lane.name} (specialist_dispatch_failed: ${truncateMiddle(String((error as Error).message ?? error), 160)} — falling back to inline)`,
		);
		return specialistHandledStop({
			outputs,
			decisions,
			stopReason: "specialist_fallback",
			brk: false,
		});
	}
}
