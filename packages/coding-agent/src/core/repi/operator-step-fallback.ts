/** Operator step handlers: memory playbooks + operation fallback + reverse_next. */

import type { ExtensionAPI } from "../extensions/types.ts";
import type { OperationExecution, OperatorStep } from "./operator-step-deps.ts";
import { d } from "./operator-step-deps.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";

type Done = (output: string) => OperationExecution;
type Blocked = (output: string) => OperationExecution;

export async function executeOperatorFallbackStep(
	pi: ExtensionAPI,
	step: OperatorStep,
	command: string,
	target: string | undefined,
	done: Done,
	blocked: Blocked,
): Promise<OperationExecution> {
	if (/^re[-_]memory\s+playbooks$/i.test(command)) return done(d().formatPlaybookMaintenance(d().maintainPlaybooks()));
	if (/^re[-_]memory\s+prune-playbooks$/i.test(command))
		return done(d().formatPlaybookMaintenance(d().maintainPlaybooks({ archive: true })));
	const operationResult = await d().executeOperationStep(pi, d().operationStepFromOperator(step), target);
	if (operationResult.status === "blocked" && /unsupported operation command/.test(operationResult.output)) {
		const reverseHint = reverseDomainCaptureNextCommands({
			routeOrBlob: command,
			target,
		}).slice(0, 3);
		return blocked(
			[
				`unsupported operator command: ${command}`,
				...(reverseHint.length ? ["reverse_next:", ...reverseHint] : []),
			].join("\n"),
		);
	}
	return operationResult;
}
