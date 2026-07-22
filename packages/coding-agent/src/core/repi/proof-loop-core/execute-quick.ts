/** Proof-loop quick-path command execution + step marking. */

import type { ExtensionAPI } from "../../extensions/types.ts";
import type { OperationExecution } from "../operator-step.ts";
import { executeOperatorStep } from "../operator-step-execute.ts";
import type { ProofLoopArtifact } from "../proof-loop-runtime.ts";
import { slug } from "../text.ts";
import { proofLoopPhaseForCommand } from "./execute-phase.ts";
import { executeProofLoopStep } from "./execute-step.ts";

export async function executeProofLoopQuickPathCommand(
	pi: ExtensionAPI,
	proof: ProofLoopArtifact,
	command: string,
	index: number,
): Promise<OperationExecution> {
	const phase = proofLoopPhaseForCommand(command);
	const stepId = `proof:quick:${index + 1}:${slug(command).slice(0, 32)}`;
	const result = phase
		? await executeProofLoopStep(
				pi,
				{
					id: stepId,
					phase,
					command,
					status: "ready",
					sourceArtifacts: proof.sourceArtifacts,
				},
				proof.target,
				proof.replaySteps,
			)
		: await executeOperatorStep(
				pi,
				{
					id: stepId,
					command,
					status: "ready",
					priority: 0,
					sourceArtifacts: proof.sourceArtifacts,
				},
				proof.target,
			);
	return {
		...result,
		output: [
			`quick_path_execution: index=${index + 1} phase=${phase ?? "operator"} command=${command}`,
			result.output,
		].join("\n"),
	};
}

export function markProofLoopStepForCommand(
	proof: ProofLoopArtifact,
	command: string,
	result: OperationExecution,
): void {
	const normalized = command.trim().replace(/\s+/g, " ");
	const phase = proofLoopPhaseForCommand(command);
	const step =
		proof.steps.find(
			(candidate) => candidate.status === "ready" && candidate.command.trim().replace(/\s+/g, " ") === normalized,
		) ??
		(phase
			? proof.steps.find((candidate: any) => candidate.status === "ready" && candidate.phase === phase)
			: undefined);
	if (!step) return;
	step.status = result.status === "blocked" ? "blocked" : "done";
	step.reason =
		result.status === "blocked"
			? result.output
			: step.reason
				? `${step.reason}; quick_path_executed`
				: "quick_path_executed";
}
