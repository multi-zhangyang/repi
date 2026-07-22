/** Operator feedback classification. */

import { operatorFeedbackRow } from "./core-helpers.ts";
import { latestSwarmRetryQueue } from "./deps.ts";
import { classifyOperatorExecutionFeedback } from "./feedback-classify-execution.ts";

export function classifyOperatorFeedback(operator: any, operatorArtifact?: string, target?: string): string[] {
	const rows: string[] = [];
	const targetRef = target ?? operator.target ?? "<target>";
	for (const execution of operator.executed) {
		const row = classifyOperatorExecutionFeedback(execution, targetRef, operatorArtifact);
		if (row) rows.push(row);
	}
	for (const line of operator.commanderDispatchReport) {
		if (/failure_budget_exhausted|stop_dispatch=true/i.test(line)) {
			rows.push(
				operatorFeedbackRow({
					category: "failure_budget_exhausted",
					command: "commander_dispatch_report",
					status: "blocked",
					next: `re_proof_loop run ${targetRef} 4 2`,
					evidence: line,
					operatorArtifact,
				}),
			);
		}
	}
	const swarmRetry = latestSwarmRetryQueue(target ?? operator.target);
	for (const row of swarmRetry.rows.slice(0, 8)) {
		rows.push(
			operatorFeedbackRow({
				category: "swarm_retry_queue",
				command: "swarm_retry_queue",
				status: "queued",
				next: swarmRetry.commands[0] ?? `re_swarm run ${targetRef} 1 1`,
				evidence: row,
				operatorArtifact,
			}),
		);
	}
	return Array.from(new Set(rows)).slice(0, 40);
}
