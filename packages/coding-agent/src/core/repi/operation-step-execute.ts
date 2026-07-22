/**
 * Operation step command dispatcher (reverse run-first defaults).
 */
import type { ExtensionAPI } from "../extensions/types.ts";
import { tryExecuteOperationControlStep } from "./operation-step-control.ts";
import type { OperationStep } from "./operation-step-deps.ts";
import { executeOperationFallbackStep } from "./operation-step-fallback.ts";
import { tryExecuteOperationReverseStep } from "./operation-step-reverse.ts";
import type { OperationExecution } from "./operator-step.ts";

export async function executeOperationStep(
	pi: ExtensionAPI,
	step: OperationStep,
	target?: string,
): Promise<OperationExecution> {
	const command = step.command.trim();
	const done = (output: string): OperationExecution => ({ stepId: step.id, command, status: "done", output });
	const blocked = (output: string): OperationExecution => ({ stepId: step.id, command, status: "blocked", output });
	if (/<target>|<TARGET>|<URL>|<none>/i.test(command)) return blocked("unresolved target placeholder");
	const control = await tryExecuteOperationControlStep(pi, command, target, done, blocked);
	if (control) return control;
	const reverse = await tryExecuteOperationReverseStep(pi, command, target, done);
	if (reverse) return reverse;
	return executeOperationFallbackStep(pi, command, target, done, blocked);
}
