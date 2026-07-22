/** Failure-repair domain appenders with reverse domain next. */

import { latestAutofixArtifactPath } from "../autofix/helpers.ts";
import { operatorFeedbackCategory } from "../operator-runtime/feedback-category.ts";
import { runtimeFailureCommandTarget } from "../repair-rollback-core.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { slug, truncateMiddle } from "../text.ts";
import { runtimeFailureCategory } from "./classify.ts";
import { latestProofLoopArtifactPath, operatorFeedbackFallbackCommands } from "./classify-deps.ts";
import { appendRuntimeFailureInputs } from "./ledger-append.ts";
import type { RuntimeFailureRepairInput } from "./types.ts";

export function appendRuntimeFailureRepairFromOperator(operator: any, path: string): void {
	if (operator.mode !== "dispatch") return;
	const targetRef = runtimeFailureCommandTarget(operator.target);
	const sourceArtifacts = [path, operator.contextArtifact, ...operator.sourceArtifacts].filter(Boolean) as string[];
	const inputs: RuntimeFailureRepairInput[] = [];
	for (const execution of operator.executed.filter((item: any) => item.status === "blocked").slice(0, 16)) {
		inputs.push({
			source: "re_operator",
			scope: `${operator.target ?? operator.route ?? operator.missionId ?? "operator"}:${execution.stepId}`,
			target: operator.target,
			reason: `operator execution blocked: command=${execution.command}; output=${truncateMiddle(execution.output, 360)}`,
			category: runtimeFailureCategory(execution.output),
			status: "blocked",
			commands: [
				`re_autofix plan ${targetRef}`,
				`re_proof_loop run ${targetRef} 4 2`,
				...(/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
					`${targetRef} ${execution.command} ${execution.output}`,
				)
					? reverseDomainCaptureNextCommands({
							routeOrBlob: `${targetRef} ${execution.command} ${execution.output}`,
							target: targetRef,
						})
					: [`re_operator escalate ${targetRef}`]),
			],
			failedChecks: ["operator_queue_ready", "proof_loop_ready"],
			sourceArtifacts,
			expectedArtifacts: [path, latestProofLoopArtifactPath()].filter(Boolean) as string[],
		});
	}
	for (const step of operator.steps.filter((item: any) => item.status === "blocked").slice(0, 16)) {
		inputs.push({
			source: "re_operator",
			scope: `${operator.target ?? operator.route ?? operator.missionId ?? "operator"}:${step.id}`,
			target: operator.target,
			reason: `operator step blocked: ${step.reason ?? "blocked"}; command=${step.command}`,
			category: runtimeFailureCategory(`${step.reason ?? ""} ${step.command}`),
			status: "blocked",
			commands: [
				`re_autofix plan ${targetRef}`,
				...(/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|proof_exit|bind_ready/i.test(
					`${targetRef} ${step.reason ?? ""} ${step.command}`,
				)
					? reverseDomainCaptureNextCommands({
							routeOrBlob: `${targetRef} ${step.reason ?? ""} ${step.command}`,
							target: targetRef,
						})
					: [`re_operator escalate ${targetRef}`]),
			],
			failedChecks: ["operator_queue_ready"],
			sourceArtifacts: [path, ...step.sourceArtifacts, ...sourceArtifacts],
			expectedArtifacts: [path].filter(Boolean),
		});
	}
	for (const row of operator.operatorFeedback
		.filter((item: any) =>
			/(missing_tool_or_dependency|unresolved_target|runtime_failure|dispatcher_gap|failure_budget_exhausted|swarm_retry_queue|worker_retry_blocked)/i.test(
				item,
			),
		)
		.slice(0, 16)) {
		const category = operatorFeedbackCategory(row);
		const commands = operatorFeedbackFallbackCommands(row, operator.target);
		inputs.push({
			source: "re_operator",
			scope: `${operator.target ?? operator.route ?? operator.missionId ?? "operator"}:feedback:${slug(row).slice(0, 24)}`,
			target: operator.target,
			reason: `operator feedback ${category}: ${row}`,
			category: runtimeFailureCategory(row),
			status: /failure_budget_exhausted/i.test(row) ? "exhausted" : "repair_queued",
			commands: commands.length ? commands : [`re_operator escalate ${targetRef}`],
			failedChecks: ["operator_queue_ready", "autofix_ready"],
			sourceArtifacts,
			expectedArtifacts: [path, latestAutofixArtifactPath()].filter(Boolean) as string[],
		});
	}
	for (const report of operator.commanderDispatchReport
		.filter((item: any) => /failure_budget_exhausted/i.test(item))
		.slice(0, 4)) {
		inputs.push({
			source: "re_operator",
			scope: `${operator.target ?? operator.route ?? operator.missionId ?? "operator"}:failure_budget`,
			target: operator.target,
			reason: report,
			category: "contract_gap",
			status: "exhausted",
			commands: [`re_proof_loop run ${targetRef} 4 2`, `re_operator escalate ${targetRef}`],
			failedChecks: ["operator_queue_ready", "proof_loop_ready"],
			sourceArtifacts,
			expectedArtifacts: [path, latestProofLoopArtifactPath()].filter(Boolean) as string[],
		});
	}
	appendRuntimeFailureInputs(inputs);
}
