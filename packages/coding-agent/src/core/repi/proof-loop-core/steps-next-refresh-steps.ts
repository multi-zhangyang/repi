/** Proof-loop refresh step builders (runtime/compact/graph/failure/operator). */

import { repiProofLoopQuickPathFromItems as proofLoopQuickPathFromItems } from "../proof-loop.ts";
import type { ProofLoopArtifact, ProofLoopStep } from "../proof-loop-runtime.ts";
import {
	failureSignaturePriorityReport,
	latestOperatorFeedback,
	latestReconCompactionResumeTelemetry,
} from "./deps.ts";
import { proofLoopGapItems, proofLoopSourceArtifacts, proofLoopTargetRuntimeAdapterCommands } from "./gaps.ts";
import { compactResumeProofQueue, operatorFeedbackProofLoopCommands } from "./memory.ts";
import { mapProofLoopRefreshCommandSteps } from "./steps-next-refresh-map.ts";

export function buildProofLoopRefreshSteps(proof: ProofLoopArtifact): {
	steps: ProofLoopStep[];
	operatorFeedback: ReturnType<typeof latestOperatorFeedback>;
	operatorFeedbackQueue: string[];
	failureSignature: ReturnType<typeof failureSignaturePriorityReport>;
	compactResume: ReturnType<typeof latestReconCompactionResumeTelemetry>;
	compactResumeQueue: string[];
} {
	const operatorFeedback = latestOperatorFeedback(proof.target);
	const operatorFeedbackQueue = operatorFeedbackProofLoopCommands(operatorFeedback, proof.target);
	const existingCommands = new Set(proof.steps.map((step: any) => step.command));
	const failureSignature = failureSignaturePriorityReport(proof.target);
	const compactResume = latestReconCompactionResumeTelemetry();
	const compactResumeQueue = compactResumeProofQueue();
	const graphGapItems = proofLoopGapItems(proof.target).filter((item: any) => item.source === "attack_graph");
	const graphGapCommands = proofLoopQuickPathFromItems(graphGapItems, proof.target).filter((command: any) =>
		/^(?:re_graph build|re_runtime_adapter )/i.test(command),
	);
	const targetRuntimeCommands = proofLoopTargetRuntimeAdapterCommands(proof.target);
	let base = proof.steps.length;
	const targetRuntimeSteps = mapProofLoopRefreshCommandSteps({
		commands: targetRuntimeCommands,
		existingCommands,
		baseIndex: base,
		phase: "runtime-adapter",
		reason: "source=target_auto_detection",
		sourceArtifacts: proofLoopSourceArtifacts(proof.target),
		target: proof.target,
	});
	base += targetRuntimeSteps.length;
	const compactResumeSteps = mapProofLoopRefreshCommandSteps({
		commands: compactResumeQueue,
		existingCommands,
		baseIndex: base,
		phase: "compact-resume",
		reason: "source=compact_resume",
		sourceArtifacts: [compactResume.path],
		target: proof.target,
	});
	base += compactResumeSteps.length;
	const graphGapSteps = mapProofLoopRefreshCommandSteps({
		commands: graphGapCommands,
		existingCommands,
		baseIndex: base,
		phase: (command) => (/^re_runtime_adapter /i.test(command) ? "runtime-adapter" : "attack-graph"),
		reason: "source=attack_graph_gap",
		sourceArtifacts: Array.from(new Set(graphGapItems.flatMap((item: any) => item.sourceArtifacts))).slice(0, 16),
		target: proof.target,
	});
	base += graphGapSteps.length;
	const failureSignatureSteps = mapProofLoopRefreshCommandSteps({
		commands: failureSignature.commands,
		existingCommands,
		baseIndex: base,
		phase: "failure-signature",
		reason: "source=failure_signature_priority",
		sourceArtifacts: failureSignature.sourceArtifacts,
		target: proof.target,
	});
	base += failureSignatureSteps.length;
	const operatorFeedbackSteps = mapProofLoopRefreshCommandSteps({
		commands: operatorFeedbackQueue,
		existingCommands,
		baseIndex: base,
		phase: "operator-feedback",
		reason: () => undefined,
		sourceArtifacts: operatorFeedback.sourceArtifacts,
		target: proof.target,
	});
	const steps = [
		...proof.steps,
		...targetRuntimeSteps,
		...failureSignatureSteps,
		...compactResumeSteps,
		...graphGapSteps,
		...operatorFeedbackSteps,
	];
	return {
		steps,
		operatorFeedback,
		operatorFeedbackQueue,
		failureSignature,
		compactResume,
		compactResumeQueue,
	};
}
