/** Proof-loop runtime failure repair bridge. */

import { latestAutofixArtifactPath } from "../autofix.ts";
import type { ProofLoopArtifact } from "../proof-loop-runtime.ts";
import type { RuntimeFailureRepairInput } from "../runtime-types/failure.ts";
import { latestSupervisorArtifactPath } from "../supervisor.ts";
import { truncateMiddle } from "../text.ts";
import { appendRuntimeFailureInputs, runtimeFailureCategory, runtimeFailureCommandTarget } from "./deps.ts";

export function appendRuntimeFailureRepairFromProofLoop(proof: ProofLoopArtifact, path: string): void {
	if (
		proof.mode !== "run" ||
		(!["needs_repair", "blocked"].includes(proof.verdict) &&
			!proof.steps.some((step: any) => step.status === "blocked") &&
			!proof.executed.some((execution: any) => execution.status === "blocked"))
	)
		return;
	const targetRef = runtimeFailureCommandTarget(proof.target);
	const sourceArtifacts = [path, ...proof.bridgeArtifacts, ...proof.sourceArtifacts].filter(Boolean) as string[];
	const repairCommands = proof.nextActions.length
		? proof.nextActions.slice(0, 10)
		: [`re_autofix plan ${targetRef}`, `re_delegate plan ${targetRef}`, `re_swarm run ${targetRef}`];
	const inputs: RuntimeFailureRepairInput[] = [];
	if (proof.verdict === "needs_repair" || proof.verdict === "blocked") {
		const reason = `proof loop verdict=${proof.verdict}; specialist=${proof.specialistQueue.length}; swarm_bridge=${proof.swarmBridge.length}; operator_feedback=${proof.operatorFeedback.length}`;
		inputs.push({
			source: "re_proof_loop",
			scope: `${proof.target ?? proof.route ?? proof.missionId ?? "proof"}:verdict`,
			target: proof.target,
			reason,
			category: "contract_gap",
			status: proof.verdict === "blocked" ? "blocked" : "repair_queued",
			commands: repairCommands,
			failedChecks: ["proof_loop_ready", "verifier_matrix_ready", "compiler_ready", "replay_ready", "autofix_ready"],
			sourceArtifacts,
			expectedArtifacts: [path, latestSupervisorArtifactPath(), latestAutofixArtifactPath()].filter(
				Boolean,
			) as string[],
		});
	}
	for (const step of proof.steps.filter((item: any) => item.status === "blocked").slice(0, 16)) {
		inputs.push({
			source: "re_proof_loop",
			scope: `${proof.target ?? proof.route ?? proof.missionId ?? "proof"}:${step.id}`,
			target: proof.target,
			reason: `proof-loop step blocked: ${step.reason ?? "blocked"}; command=${step.command}`,
			category: runtimeFailureCategory(`${step.reason ?? ""} ${step.command}`),
			status: "blocked",
			commands: [step.command, ...repairCommands].slice(0, 8),
			failedChecks: ["proof_loop_ready"],
			sourceArtifacts: [path, ...step.sourceArtifacts, ...sourceArtifacts],
			expectedArtifacts: [path].filter(Boolean),
		});
	}
	for (const execution of proof.executed.filter((item: any) => item.status === "blocked").slice(0, 16)) {
		inputs.push({
			source: "re_proof_loop",
			scope: `${proof.target ?? proof.route ?? proof.missionId ?? "proof"}:${execution.stepId}`,
			target: proof.target,
			reason: `proof-loop execution blocked: command=${execution.command}; output=${truncateMiddle(execution.output, 360)}`,
			category: runtimeFailureCategory(execution.output),
			status: "blocked",
			commands: repairCommands,
			failedChecks: ["proof_loop_ready", "operator_queue_ready"],
			sourceArtifacts,
			expectedArtifacts: [path, latestAutofixArtifactPath()].filter(Boolean) as string[],
		});
	}
	appendRuntimeFailureInputs(inputs);
}
