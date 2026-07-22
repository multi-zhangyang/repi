/** Auto-lane inline command-pack step. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { envBoolean, truncateMiddle } from "../text.ts";
import { autoCommandsForLane, autoLaneCommandPack, removeLaneNextItems } from "./commands.ts";
import { formatRunAutoDecision, llmLaneRunDecision, parseLaneRunDecision } from "./decision.ts";
import { d } from "./deps.ts";
import { runAutoLaneBootstrapOnly } from "./run-inline-step-bootstrap.ts";
import { resolveAutoLaneInlineDecision } from "./run-inline-step-decide.ts";
import { autoLaneInlineReverseSections } from "./run-inline-step-reverse.ts";
import type { RunAutoDecision } from "./types.ts";

export async function runAutoLaneInlineStep(params: {
	pi: ExtensionAPI;
	lane: any;
	mission: any;
	target?: string;
	step: number;
	maxSteps: number;
	maxCommandsPerStep: number;
	reasoning?: "regex" | "llm";
	cwd?: string;
	decisions: RunAutoDecision[];
	outputs: string[];
}): Promise<{
	stop: boolean;
	stopReason: string;
	requestedLane?: string;
}> {
	const { pi, lane, mission, target, step, maxSteps, maxCommandsPerStep, reasoning, cwd, decisions, outputs } = params;
	const { commands, rawItems } = autoCommandsForLane(lane, maxCommandsPerStep);
	if (commands.length === 0) {
		return (
			(await runAutoLaneBootstrapOnly({ pi, lane, step, maxSteps, decisions, outputs })) ?? {
				stop: true,
				stopReason: `no_auto_commands:${lane.name}`,
			}
		);
	}
	removeLaneNextItems(lane.name, rawItems);
	const pack = autoLaneCommandPack(mission, lane, commands, target);
	const text = await d().runLaneCommandPack(pi, pack);
	let decision = parseLaneRunDecision(text, lane.name);
	let llmNote = "";
	if (reasoning === "llm" && cwd && !envBoolean("REPI_AGENT_THREAD")) {
		try {
			decision = await llmLaneRunDecision({ cwd, text, lane, mission, target });
			llmNote = "llm-step-planner: applied";
		} catch (error) {
			llmNote = `llm-step-planner: fallback_to_regex (${truncateMiddle(String((error as Error).message ?? error), 160)})`;
		}
	}
	const sections = [`## run-auto step ${step + 1}: ${lane.name}`, truncateMiddle(text, 14000)];
	if (llmNote) sections.push(llmNote);
	const bootstrapClosure = await d().runToolBootstrapClosure(pi, { lane, text });
	if (bootstrapClosure) {
		decision = bootstrapClosure.decision;
		sections.push(`## tool-bootstrap-closure step ${step + 1}\n${bootstrapClosure.text}`);
	}
	sections.push(
		...autoLaneInlineReverseSections({
			laneName: lane.name,
			objective: lane.objective,
			text,
			target,
		}),
	);
	decisions.push(decision);
	sections.push(formatRunAutoDecision(decision));
	outputs.push(sections.join("\n"));
	return resolveAutoLaneInlineDecision({
		lane,
		decision,
		text,
		target,
		step,
		maxSteps,
		decisions,
		outputs,
	});
}
