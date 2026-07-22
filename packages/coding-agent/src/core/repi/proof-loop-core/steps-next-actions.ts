/** Proof-loop next-actions with reverse domain next */

import { caseMemoryOperatorCommands } from "../memory-stubs.ts";
import type { ProofLoopArtifact } from "../proof-loop-runtime.ts";
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";
import { autonomousExecutionBudget, failureSignaturePriorityReport, latestSwarmRetryQueue } from "./deps.ts";
import { proofLoopQuickPath } from "./gaps.ts";

export function proofLoopNextActions(proof: ProofLoopArtifact): string[] {
	const reverseOpen =
		/reverse_proof_exit_gate=false|phase=0b:reverse_proof_exit|pending_runtime_capture|bind_ready=false|reverse_kind/i.test(
			JSON.stringify(proof ?? {}),
		) ||
		(Array.isArray((proof as any)?.gaps) &&
			(proof as any).gaps.some((g: any) =>
				/proof_exit|technique|reverse|mitre|cwe/i.test(String(g?.text ?? g ?? "")),
			));
	const ready = proof.steps.filter((step: any) => step.status === "ready");
	const target = proof.target ?? "<target>";
	const caseMemoryActions = caseMemoryOperatorCommands(proof.caseMemoryLanePlan, proof.target);
	const failureSignatureCommands = failureSignaturePriorityReport(proof.target).commands;
	const swarmRetryCommands = latestSwarmRetryQueue(proof.target).commands;
	const autonomousBudgetActions =
		proof.autonomousBudget?.nextActions ?? autonomousExecutionBudget(proof.target).nextActions;
	const quickPath = proof.quickPath?.length ? proof.quickPath : proofLoopQuickPath(proof.target);
	const needsSpecialistBridge =
		proof.verdict === "partial" || proof.verdict === "needs_repair" || proof.specialistQueue.length > 0;
	const specialistBridge = needsSpecialistBridge
		? [`re_delegate plan ${target}`, `re_swarm run ${target} 2 1`, "re_swarm merge", `re_supervisor repair ${target}`]
		: [];
	const reverseCommands = reverseOpen
		? reverseDomainCaptureNextCommands({
				routeOrBlob: JSON.stringify(proof ?? {}),
				target: proof.target,
			})
		: [];
	const base =
		proof.mode === "run"
			? [
					...reverseCommands,
					...specialistBridge,
					...(proof.verdict === "needs_repair" ? ["re_autofix apply", `re_replayer run ${target} 1`] : []),
					...(proof.verdict === "ready"
						? ["re_compiler final", "re_knowledge_graph build", ...(reverseOpen ? [] : ["re_complete audit"])]
						: []),
					...(proof.verdict === "partial" ? [`re_proof_loop run ${target} 4 ${proof.replaySteps}`] : []),
				]
			: [...reverseCommands, ...specialistBridge, `re_proof_loop run ${target} 4 ${proof.replaySteps}`];
	return Array.from(
		new Set([
			...reverseCommands,
			...(proof.compactResumeQueue ?? []),
			...failureSignatureCommands,
			...(proof.operatorFeedbackQueue ?? []),
			...quickPath,
			...autonomousBudgetActions,
			...swarmRetryCommands,
			...caseMemoryActions,
			...ready.slice(proof.executed.length, proof.executed.length + 6).map((step: any) => step.command),
			...base,
		]),
	).slice(0, 16);
}
