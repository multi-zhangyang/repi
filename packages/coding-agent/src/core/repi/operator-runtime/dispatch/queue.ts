/** Operator queue dispatch. */
/** Operator dispatch, budget, dispatcher scoreboard. */

import type { ExtensionAPI } from "../../../extensions/types.ts";
import { readCurrentMission } from "../../mission.ts";
import { formatOperator } from "../../operator-format-format.ts";
import { interestingLines } from "../../text.ts";
import { buildOperator, writeOperatorArtifact } from "../core.ts";
import { executeOperatorStep } from "../deps.ts";
import { commanderBudgetValue, isCommanderRuntimeCommand } from "./budget.ts";
import { enrichOperatorAfterDispatch } from "./queue-enrich.ts";

export async function dispatchOperatorQueue(
	pi: ExtensionAPI,
	options: { target?: string; maxSteps?: number } = {},
): Promise<string> {
	const operator = buildOperator({ target: options.target, mode: "dispatch" });
	const requestedMaxSteps = Math.max(1, Math.min(10, Math.floor(options.maxSteps ?? 1)));
	const policyMaxDispatch = commanderBudgetValue(operator.commanderPolicy, "max_dispatch", requestedMaxSteps);
	const maxSteps = Math.max(1, Math.min(10, requestedMaxSteps, policyMaxDispatch));
	const failureBudget = commanderBudgetValue(operator.commanderPolicy, "failure_budget", maxSteps);
	const retryLimit = commanderBudgetValue(operator.commanderPolicy, "retry_limit_per_worker", 1);
	let commanderFailures = 0;
	for (const step of operator.steps.filter((item: any) => item.status === "ready").slice(0, maxSteps)) {
		const result = await executeOperatorStep(pi, step, operator.target);
		operator.executed.push(result);
		step.status = result.status === "blocked" ? "blocked" : "done";
		step.reason = result.status === "blocked" ? result.output : step.reason;
		const commanderRuntime = isCommanderRuntimeCommand(step.command);
		if (commanderRuntime && result.status === "blocked") commanderFailures += 1;
		operator.commanderDispatchReport.push(
			`${step.id} commander=${commanderRuntime ? "yes" : "no"} status=${result.status} failures=${commanderFailures}/${failureBudget} retry_limit=${retryLimit} command=${step.command}`,
		);
		if (/^re[-_](?:autopilot|auto)\b/i.test(step.command) || /case_memory_lane_plan/i.test(result.output)) {
			const lines = interestingLines(
				result.output,
				/case_memory_lane_plan|case_memory_migrations|target_lane|added_lane|skipped_lane|action:\s*(?:reprioritized|added|skipped|none)/i,
				16,
			);
			operator.caseMemoryDispatchReport.push(
				`${step.id} status=${result.status} command=${step.command}`,
				...(lines.length ? lines : ["case_memory_lane_plan: no parsed output lines"]),
			);
		}
		if (commanderRuntime && commanderFailures >= failureBudget) {
			operator.commanderDispatchReport.push(`failure_budget_exhausted=${failureBudget}; stop_dispatch=true`);
			break;
		}
	}
	const _pendingGates =
		readCurrentMission()
			?.checkpoints.filter((checkpoint: any) => checkpoint.status !== "done")
			.map((checkpoint: any) => checkpoint.name) ?? [];
	enrichOperatorAfterDispatch({ operator, retryLimit });
	const path = writeOperatorArtifact(operator);
	return formatOperator(operator, path);
}
