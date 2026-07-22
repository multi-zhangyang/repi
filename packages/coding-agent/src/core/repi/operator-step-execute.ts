/**
 * Operator step command dispatcher (reverse run-first defaults).
 */
import type { ExtensionAPI } from "../extensions/types.ts";
import { tryExecuteOperatorControlStep } from "./operator-step-control.ts";
import type { OperationExecution, OperatorStep } from "./operator-step-deps.ts";
import { executeOperatorFallbackStep } from "./operator-step-fallback.ts";
import { tryExecuteOperatorReverseStep } from "./operator-step-reverse.ts";

export async function executeOperatorStep(
	pi: ExtensionAPI,
	step: OperatorStep,
	target?: string,
): Promise<OperationExecution> {
	const command = step.command.trim().replace(/^\//, "");
	const done = (output: string): OperationExecution => ({ stepId: step.id, command, status: "done", output });
	const blocked = (output: string): OperationExecution => ({ stepId: step.id, command, status: "blocked", output });
	if (step.status === "blocked") return blocked(step.reason ?? "operator step is blocked");
	const control = await tryExecuteOperatorControlStep(pi, command, target, done, blocked);
	if (control) return control;
	const reverse = await tryExecuteOperatorReverseStep(pi, command, target, done);
	if (reverse) return reverse;
	return executeOperatorFallbackStep(pi, step, command, target, done, blocked);
}
