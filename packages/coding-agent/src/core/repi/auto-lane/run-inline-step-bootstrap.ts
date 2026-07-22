/** Bootstrap-only path when lane has no auto commands. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { formatRunAutoDecision } from "./decision.ts";
import { d } from "./deps.ts";
import type { RunAutoDecision } from "./types.ts";

export async function runAutoLaneBootstrapOnly(params: {
	pi: ExtensionAPI;
	lane: any;
	step: number;
	maxSteps: number;
	decisions: RunAutoDecision[];
	outputs: string[];
}): Promise<{ stop: boolean; stopReason: string; requestedLane?: string } | undefined> {
	const { pi, lane, step, maxSteps, decisions, outputs } = params;
	const bootstrapClosure = await d().runToolBootstrapClosure(pi, { lane, text: "" });
	if (!bootstrapClosure) return undefined;
	const decision = bootstrapClosure.decision;
	decisions.push(decision);
	outputs.push(
		[
			`## run-auto step ${step + 1}: ${lane.name}`,
			`## tool-bootstrap-closure step ${step + 1}\n${bootstrapClosure.text}`,
			formatRunAutoDecision(decision),
		].join("\n"),
	);
	if (decision.action === "continue_next") {
		return {
			stop: false,
			requestedLane: decision.nextLane,
			stopReason: step + 1 >= maxSteps ? `max_steps_reached_after:${decision.reason}` : "adaptive_continue_next",
		};
	}
	return { stop: true, stopReason: decision.reason };
}
