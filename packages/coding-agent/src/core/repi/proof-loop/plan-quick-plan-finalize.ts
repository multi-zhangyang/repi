/** Finalize proof-loop quick plan: bound commands + assertions. */
import type { RepiProofLoopQuickPlanPhaseV1, RepiProofLoopQuickPlanV1 } from "./types.ts";

export function finalizeRepiProofLoopQuickPlan(params: {
	targetRef: string;
	classOrder: any[];
	classes: Set<string>;
	commands: string[];
	phases: RepiProofLoopQuickPlanPhaseV1[];
}): RepiProofLoopQuickPlanV1 {
	const { targetRef, classOrder, classes } = params;
	const commands = [...params.commands];
	const phases = [...params.phases];
	const loopCommand = `re_proof_loop run ${targetRef} 4 2`;
	if (!commands.includes(loopCommand)) commands.push(loopCommand);
	phases.push({
		phase: "final_loop",
		reason: "rerun the proof loop after repairs to force gap closure or escalation",
		classes: [],
		commands: [loopCommand],
		evidenceRefs: [],
	});
	const unique = Array.from(new Set(commands));
	const boundedCommands = [...unique.filter((command: any) => command !== loopCommand).slice(0, 13), loopCommand];
	const omittedCommands = unique.filter((command: any) => !boundedCommands.includes(command));
	const runtimeAdapterIndex = boundedCommands.findIndex((command: any) => command.startsWith("re_runtime_adapter "));
	const firstReplayIndex = boundedCommands.findIndex((command: any) => command.startsWith("re_replayer run "));
	const autofixApplyIndex = boundedCommands.findIndex((command: any) => command.startsWith("re_autofix apply "));
	let finalReplayIndex = -1;
	for (let index = 0; index < boundedCommands.length; index += 1) {
		if (boundedCommands[index]?.startsWith("re_replayer run ")) finalReplayIndex = index;
	}
	return {
		kind: "ProofLoopQuickPlanV1",
		schemaVersion: 1,
		target: targetRef,
		classOrder,
		phases,
		commands: boundedCommands,
		omittedCommands,
		finalLoopCommand: loopCommand,
		assertions: {
			bounded: boundedCommands.length <= 14,
			deduplicated: boundedCommands.length === new Set(boundedCommands).size,
			runtimeAdapterBeforeReplay:
				!classes.has("runtime_adapter_gap") || firstReplayIndex < 0 || runtimeAdapterIndex < firstReplayIndex,
			autofixApplyBeforeFinalReplay:
				!(classes.has("replay_failure") || classes.has("timeout_or_flake")) ||
				(autofixApplyIndex >= 0 && finalReplayIndex > autofixApplyIndex),
			finalLoopLast: boundedCommands.at(-1) === loopCommand,
		},
	};
}
