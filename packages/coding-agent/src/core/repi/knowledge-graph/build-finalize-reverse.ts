/** Knowledge-graph reverse capture command merge into nextActions. */
import { reverseKnowledgeCaptureCommands } from "./reverse-commands.ts";

export function mergeKnowledgeGraphReverseNextActions(params: {
	nextActions: string[];
	nodes: any[];
	commandStrategyHints: string[];
}): string[] {
	return Array.from(
		new Set([
			...params.nextActions,
			...reverseKnowledgeCaptureCommands({
				nodes: params.nodes,
				commandStrategyHints: params.commandStrategyHints,
			}),
		]),
	).slice(0, 24);
}
