/** Context-pack next-commands + pack assembly from build state. */

import { buildAssembleContextPackArtifactInput } from "./build-core-assemble-input.ts";
import { mergeAssembleContextPackReverseNext } from "./build-core-assemble-reverse.ts";
import type { ContextPackBuildState } from "./build-core-state.ts";
import { memoryOrchestratorPhaseCommand } from "./deps.ts";
import { commandTargetSuffix } from "./index.ts";
import { assembleContextPackNextCommands } from "./next-commands.ts";
import { assembleContextPackArtifact } from "./pack-assembly.ts";
import type { ContextPackArtifact } from "./types.ts";

export function assembleContextPackFromState(state: ContextPackBuildState): ContextPackArtifact {
	const {
		mission,
		active: _active,
		supervisorPath,
		reflectionPath,
		target,
		autonomousBudget,
		swarmRetry,
		repairQueue,
		commanderMergeBudget: _commanderMergeBudget,
		memorySettings,
		includeMemoryRuntimeReports,
		caseMemoryNextCommands,
		route,
		mode,
		laneCommands,
		repairCommands,
		commanderCommands,
	} = state;
	const baseNextCommands = assembleContextPackNextCommands({
		mission,
		route,
		target,
		repairQueue,
		swarmRetryCommands: swarmRetry.commands,
		commanderCommands,
		repairCommands,
		caseMemoryNextCommands,
		autonomousBudgetNextActions: autonomousBudget.nextActions,
		memoryPhaseCommands: includeMemoryRuntimeReports
			? [memoryOrchestratorPhaseCommand(mode === "resume" ? "post-compact" : "pre-task", target)]
			: [],
		laneCommands,
		supervisorCommand: supervisorPath ? "re_supervisor repair" : `re_supervisor review${commandTargetSuffix(target)}`,
		reflectionCommand: reflectionPath ? "re_reflect write" : `re_reflect plan${commandTargetSuffix(target)}`,
		decisionCoreCommand: `re_decision_core tick${commandTargetSuffix(target)}`,
		includeMemoryNotes: memorySettings.activeRecall,
	});
	const nextCommands = mergeAssembleContextPackReverseNext({
		route: state.route,
		target: state.target,
		baseNextCommands,
	});
	const pack = assembleContextPackArtifact(buildAssembleContextPackArtifactInput(state, nextCommands));
	return pack;
}
