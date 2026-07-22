/** Context-pack next-command assembly (reverse-first, lean defaults). */

import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { reverseContextResumeCommands } from "./reverse-commands.ts";

export function assembleContextPackNextCommands(input: {
	mission?: unknown;
	route?: string;
	target?: string;
	repairQueue: string[];
	swarmRetryCommands: string[];
	commanderCommands: string[];
	repairCommands: string[];
	caseMemoryNextCommands: string[];
	autonomousBudgetNextActions: string[];
	memoryPhaseCommands?: string[];
	laneCommands: string[];
	supervisorCommand: string;
	reflectionCommand: string;
	decisionCoreCommand: string;
	includeMemoryNotes?: boolean;
}): string[] {
	const reverseResumeCommands = reverseContextResumeCommands({
		mission: input.mission,
		route: input.route,
		target: input.target,
		repairQueue: input.repairQueue,
	});
	const reverseHeavy = reverseResumeCommands.length > 0;
	// Reverse-heavy packs prioritize domain capture next and skip narrative control-plane defaults
	// (decision-core / reflect / compiler) that bloat lean reverse sessions.
	const commands = reverseHeavy
		? [
				...reverseResumeCommands,
				...input.swarmRetryCommands,
				...input.commanderCommands,
				...input.repairCommands,
				...input.caseMemoryNextCommands,
				...input.autonomousBudgetNextActions,
				...(input.memoryPhaseCommands ?? []),
				...input.laneCommands,
				"re_verifier matrix",
				"re_replayer run",
				"re_autofix plan",
				"re_knowledge_graph build",
				...(input.includeMemoryNotes ? ["re_note list", "re_techniques index"] : []),
				"re_complete audit",
				"re_context pack",
			]
		: [
				...reverseResumeCommands,
				...input.swarmRetryCommands,
				...input.commanderCommands,
				...input.repairCommands,
				...input.caseMemoryNextCommands,
				...input.autonomousBudgetNextActions,
				...(input.memoryPhaseCommands ?? []),
				input.decisionCoreCommand,
				...input.laneCommands,
				input.supervisorCommand,
				input.reflectionCommand,
				"re_verifier matrix",
				"re_compiler draft",
				"re_replayer run",
				"re_autofix plan",
				"re_knowledge_graph build",
				...(input.includeMemoryNotes ? ["re_note list", "re_techniques index"] : []),
				"re_complete audit",
				"re_context pack",
			];
	const base = Array.from(new Set(commands.filter(Boolean)));
	const reverseHeavyLocal =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready|partial_runtime_capture|runtime_capture_strong/i.test(
			`${input.route ?? ""} ${input.target ?? ""} ${base.join(" ")}`,
		);
	const reverseNext = reverseHeavyLocal
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${input.route ?? ""} ${input.target ?? ""}`,
				target: input.target,
				includeGates: true,
			}).slice(0, 3)
		: [];
	return Array.from(new Set([...reverseNext, ...base])).slice(0, 14);
}
