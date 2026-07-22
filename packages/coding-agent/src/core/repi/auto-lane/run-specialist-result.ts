/** Specialist dispatch result construction. */
import type { RunAutoDecision } from "./types.ts";

export type SpecialistDispatchResult =
	| { kind: "none" }
	| {
			kind: "handled";
			outputs: string[];
			decisions: RunAutoDecision[];
			stopReason: string;
			requestedLane?: string;
			cont: boolean;
			brk: boolean;
	  };

export function specialistHandledContinue(params: {
	outputs: string[];
	decisions: RunAutoDecision[];
	decision: RunAutoDecision;
	laneName: string;
	step: number;
	maxSteps: number;
	kind: "continue_current" | "continue_next";
}): SpecialistDispatchResult {
	const { outputs, decisions, decision, laneName, step, maxSteps, kind } = params;
	return {
		kind: "handled",
		outputs,
		decisions,
		stopReason:
			step + 1 >= maxSteps
				? `max_steps_reached_after:${decision.reason}`
				: kind === "continue_current"
					? "adaptive_continue_current"
					: "adaptive_continue_next",
		requestedLane: kind === "continue_current" ? (decision.nextLane ?? laneName) : decision.nextLane,
		cont: true,
		brk: false,
	};
}

export function specialistHandledStop(params: {
	outputs: string[];
	decisions: RunAutoDecision[];
	stopReason: string;
	brk?: boolean;
}): SpecialistDispatchResult {
	return {
		kind: "handled",
		outputs: params.outputs,
		decisions: params.decisions,
		stopReason: params.stopReason,
		brk: params.brk ?? true,
		cont: false,
	};
}
