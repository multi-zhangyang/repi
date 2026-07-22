/**
 * Operation queue runner with reverse domain next seeding.
 */

import { buildOperation, formatOperation, writeOperationArtifact } from "./campaign-runtime.ts";
import type { OperationStep } from "./operation-step-deps.ts";
import { executeOperationStep } from "./operation-step-execute.ts";
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";

export function operationStepFromOperator(step: any): OperationStep {
	return {
		id: step.id,
		phase: "operator",
		command: step.command.replace(/^re-/i, "re_"),
		status: step.status,
		reason: step.reason,
		sourceArtifacts: step.sourceArtifacts,
	};
}
export async function runOperationQueue(
	pi: any,
	options: { target?: string; task?: string; maxSteps?: number } = {},
): Promise<string> {
	const operation = buildOperation({ target: options.target, task: options.task, mode: "run" });
	const maxSteps = Math.max(1, Math.min(10, Math.floor(options.maxSteps ?? 1)));
	for (const step of operation.steps.filter((item: any) => item.status === "ready").slice(0, maxSteps)) {
		const result = await executeOperationStep(pi, step, operation.target);
		operation.executed.push(result);
		step.status = result.status === "blocked" ? "blocked" : "done";
		step.reason = result.status === "blocked" ? result.output : step.reason;
		if (result.status === "blocked") operation.blocked.push(`${step.id} ${step.command} — ${result.output}`);
	}
	const readyNext = operation.steps
		.filter((step: any) => step.status === "ready")
		.slice(0, 10)
		.map((step: any) => `re_operation run ${operation.target ?? "<target>"} 1 # ${step.id}`);
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready/i.test(
			`${operation.target ?? ""} ${options.task ?? ""} ${operation.steps.map((s: any) => s.command).join(" ")}`,
		);
	const reverseNext = reverseHeavy
		? reverseDomainCaptureNextCommands({
				routeOrBlob: `${options.task ?? ""} ${operation.steps.map((s: any) => s.command).join("\n")}`,
				target: operation.target,
			}).slice(0, 4)
		: [];
	operation.nextActions = Array.from(new Set([...reverseNext, ...readyNext])).slice(0, 12);
	const path = writeOperationArtifact(operation);
	return formatOperation(operation, path);
}
