/** Knowledge-graph next-action / reverse capture assembly. */
import { reverseKnowledgeCaptureCommands } from "./reverse-commands.ts";

export function assembleKnowledgeGraphRouting(input: {
	mission: unknown;
	route?: string;
	target?: string;
	nodes: unknown;
	edges: unknown;
	commandStrategyHints: string[];
	adaptiveRoutingHints: string[];
	workerRoutingHints: string[];
	failureSignatureCommands: string[];
	compactResumeCommandHints: string[];
	autonomousBudgetNextActions: string[];
}): {
	caseSignatures: string[];
	commandStrategyHints: string[];
	adaptiveRoutingHints: string[];
	workerRoutingHints: string[];
	nextActions: string[];
} {
	const commandStrategyHints = [...input.commandStrategyHints];
	const adaptiveRoutingHints = [...input.adaptiveRoutingHints];
	const workerRoutingHints = [...input.workerRoutingHints];
	const caseSignatures: string[] = [];
	const reverseCmds = reverseKnowledgeCaptureCommands({
		mission: input.mission,
		route: input.route,
		target: input.target,
		nodes: input.nodes,
		edges: input.edges,
		commandStrategyHints,
		adaptiveRoutingHints,
	});
	if (reverseCmds.length > 0) {
		caseSignatures.push("reverse_runtime_capture_pending");
		for (const cmd of reverseCmds) {
			caseSignatures.push(`next=${cmd}`);
			if (!commandStrategyHints.includes(cmd)) commandStrategyHints.push(cmd);
			if (!adaptiveRoutingHints.includes(cmd)) adaptiveRoutingHints.push(cmd);
			if (!workerRoutingHints.includes(cmd)) workerRoutingHints.push(cmd);
		}
	}
	const nextActions = Array.from(
		new Set([
			...input.failureSignatureCommands,
			...input.compactResumeCommandHints,
			...(commandStrategyHints.length ? commandStrategyHints.slice(0, 8) : ["re_map <target> 2"]),
			...input.autonomousBudgetNextActions,
			"re_context pack",
			"re_complete audit",
			// Prefer reverse domain runners already injected via reverseCmds over narrative operator dispatch.
			...reverseCmds,
		]),
	).slice(0, 16);
	return {
		caseSignatures,
		commandStrategyHints,
		adaptiveRoutingHints,
		workerRoutingHints,
		nextActions,
	};
}
