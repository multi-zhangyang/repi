/** Proof-loop refresh */

import { currentCaseMemoryLanePlan } from "../memory-stubs.ts";
import {
	formatRepiProofLoopGapClassifier as formatProofLoopGapClassifier,
	repiProofLoopRuntimeAdapterClosureRows as proofLoopRuntimeAdapterClosureRows,
	repiProofLoopSpecialistQueueFromItems as proofLoopSpecialistQueueFromItems,
} from "../proof-loop.ts";
import type { ProofLoopArtifact } from "../proof-loop-runtime.ts";
import { formatProofLoopRuntimeAdapterClosureRow } from "../proof-loop-runtime.ts";
import { autonomousExecutionBudget } from "./deps.ts";
import {
	proofLoopBridgeArtifacts,
	proofLoopGapItems,
	proofLoopQuickPlanRows,
	proofLoopSwarmBridgeFromItems,
	proofLoopSwarmRetryQueue,
	proofLoopVerdict,
} from "./gaps.ts";
import { caseMemoryProofBridge } from "./memory.ts";
import { assembleRefreshedProofLoop } from "./steps-next-refresh-assemble.ts";
import { buildProofLoopRefreshSteps } from "./steps-next-refresh-steps.ts";

export function refreshProofLoop(proof: ProofLoopArtifact): ProofLoopArtifact {
	const verdict = proofLoopVerdict(proof.target);
	const { steps, operatorFeedback, operatorFeedbackQueue, failureSignature, compactResume, compactResumeQueue } =
		buildProofLoopRefreshSteps(proof);
	const gapItems = proofLoopGapItems(proof.target);
	const swarmRetry = proofLoopSwarmRetryQueue(proof.target);
	const specialistQueue = proofLoopSpecialistQueueFromItems(gapItems, proof.target);
	const swarmBridge = proofLoopSwarmBridgeFromItems(gapItems, proof.target);
	const bridgeArtifacts = proofLoopBridgeArtifacts(proof.target);
	const caseMemoryLanePlan = currentCaseMemoryLanePlan(proof.target);
	const caseMemoryBridge = caseMemoryProofBridge(caseMemoryLanePlan, proof.target);
	const autonomousBudget = autonomousExecutionBudget(proof.target);
	const gapClassifier = formatProofLoopGapClassifier(gapItems);
	const quickPlan = proofLoopQuickPlanRows(gapItems, proof.target);
	const quickPath = quickPlan.commands;
	const runtimeAdapterClosure = proofLoopRuntimeAdapterClosureRows(gapItems, proof.target)
		.map(formatProofLoopRuntimeAdapterClosureRow)
		.slice(0, 12);
	return assembleRefreshedProofLoop({
		proof,
		steps,
		verdict,
		gapClassifier,
		quickPath,
		quickPlan,
		runtimeAdapterClosure,
		caseMemoryLanePlan,
		caseMemoryBridge,
		autonomousBudget,
		failureSignature,
		compactResume,
		compactResumeQueue,
		operatorFeedback,
		operatorFeedbackQueue,
		swarmRetry,
		specialistQueue,
		swarmBridge,
		bridgeArtifacts,
	});
}
