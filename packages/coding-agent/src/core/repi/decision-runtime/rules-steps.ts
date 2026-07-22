/** Decision-core operator step materialization. */

import { slug } from "../text.ts";
import { operatorCommandConcrete, operatorStepPriority } from "./deps.ts";
import type { DecisionCoreArtifact } from "./types.ts";

type OperatorStep = any;

export function decisionOperatorSteps(decision: DecisionCoreArtifact): OperatorStep[] {
	const seen = new Set<string>();
	const steps: OperatorStep[] = [];
	for (const raw of decision.operatorQueue) {
		const concrete = operatorCommandConcrete(raw, decision.target);
		const command = concrete.command.trim();
		if (!command || seen.has(command)) continue;
		seen.add(command);
		steps.push({
			id: `decision:${steps.length + 1}:${slug(command).slice(0, 30)}`,
			command,
			status: concrete.blocked ? "blocked" : "ready",
			priority: operatorStepPriority(command),
			reason: concrete.blocked,
			sourceArtifacts: decision.sourceArtifacts,
		});
	}
	return steps.sort((a: any, b: any) => a.priority - b.priority || a.id.localeCompare(b.id));
}
