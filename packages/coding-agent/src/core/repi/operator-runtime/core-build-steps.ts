/** Operator step collection from queues/context. */

import { slug } from "../text.ts";
import { operatorCommandConcrete, operatorStepPriority } from "./feedback.ts";

export function collectOperatorSteps(params: {
	target?: string;
	context: any;
	compactResumeQueue: string[];
	compactResumePath: string;
	dispatcherCommands: string[];
	feedbackSourceArtifacts: string[];
}): any[] {
	const { target, context, compactResumeQueue, compactResumePath, dispatcherCommands, feedbackSourceArtifacts } =
		params;
	const seen = new Set<string>();
	const steps: any[] = [];
	const addStep = (raw: string, sourceArtifacts: string[] = context.sourceArtifacts) => {
		const concrete = operatorCommandConcrete(raw, target);
		const command = concrete.command.trim();
		if (!command || seen.has(command)) return;
		seen.add(command);
		steps.push({
			id: `operator:${steps.length + 1}:${slug(command).slice(0, 30)}`,
			command,
			status: concrete.blocked ? "blocked" : "ready",
			priority: operatorStepPriority(command),
			reason: concrete.blocked,
			sourceArtifacts,
		});
	};
	for (const command of compactResumeQueue) addStep(command, [compactResumePath]);
	for (const command of dispatcherCommands) addStep(command, feedbackSourceArtifacts);
	for (const command of context.nextCommands) addStep(command);
	if (steps.length === 0) {
		addStep("re_context resume");
		addStep("re_complete audit");
	}
	return [...steps].sort((a: any, b: any) => a.priority - b.priority || a.id.localeCompare(b.id));
}
