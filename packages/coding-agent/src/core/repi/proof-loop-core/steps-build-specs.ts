/** Proof-loop step specs assembly. */

import { currentCaseMemoryLanePlan } from "../memory-stubs.ts";
import {
	repiProofLoopCommandTarget as proofLoopCommandTarget,
	repiProofLoopQuickPathFromItems as proofLoopQuickPathFromItems,
} from "../proof-loop.ts";
import type { ProofLoopPhase } from "../proof-loop-runtime.ts";
import {
	failureSignaturePriorityReport,
	latestOperatorFeedback,
	latestReconCompactionResumeTelemetry,
	latestSwarmRetryQueue,
} from "./deps.ts";
import { proofLoopGapItems, proofLoopTargetRuntimeAdapterCommands } from "./gaps.ts";
import { compactResumeProofQueue, operatorFeedbackProofLoopCommands } from "./memory.ts";

export function buildProofLoopStepSpecs(target?: string): {
	specs: Array<[ProofLoopPhase, string]>;
	targetRuntimeCommands: string[];
	sourceArtifactsMeta: {
		compactResumePath: string;
		failureSignatureSourceArtifacts: string[];
		graphGapItems: any[];
	};
} {
	const suffix = proofLoopCommandTarget(target);
	const replayTarget = target?.trim() || "<target>";
	const operatorFeedback = latestOperatorFeedback(target);
	const operatorFeedbackCommands = operatorFeedbackProofLoopCommands(operatorFeedback, target);
	const swarmRetryCommands = latestSwarmRetryQueue(target).commands;
	const failureSignaturePriority = failureSignaturePriorityReport(target);
	const failureSignatureCommands = failureSignaturePriority.commands;
	const compactResume = latestReconCompactionResumeTelemetry();
	const compactResumeCommands = compactResumeProofQueue();
	const graphGapItems = proofLoopGapItems(target).filter((item: any) => item.source === "attack_graph");
	const graphGapCommands = proofLoopQuickPathFromItems(graphGapItems, target).filter((command: any) =>
		/^(?:re_graph build|re_runtime_adapter )/i.test(command),
	);
	const targetRuntimeCommands = proofLoopTargetRuntimeAdapterCommands(target);
	const specs: Array<[ProofLoopPhase, string]> = [
		...targetRuntimeCommands.map((command): [ProofLoopPhase, string] => ["runtime-adapter", command]),
		["verifier", `re_verifier matrix${suffix}`],
		["compiler", `re_compiler draft${suffix}`],
		["replayer", `re_replayer run ${replayTarget} 2`],
		["autofix", `re_autofix plan${suffix}`],
		["autofix", `re_autofix apply${suffix}`],
		["replayer", `re_replayer run ${replayTarget} 1`],
		["compiler", `re_compiler final${suffix}`],
		["knowledge", `re_knowledge_graph build${suffix}`],
		["completion", "re_complete audit"],
	];
	const caseMemoryPlan = currentCaseMemoryLanePlan(target);
	if (caseMemoryPlan?.migrations.length) {
		specs.push(["case-memory", `re_autopilot plan${suffix}`]);
		if (caseMemoryPlan.action !== "none") specs.push(["case-memory", `re_autopilot run${suffix} 1`]);
	}
	for (const command of failureSignatureCommands.slice(0, 4)) specs.push(["failure-signature", command]);
	for (const command of compactResumeCommands.slice(0, 4)) specs.push(["compact-resume", command]);
	for (const command of graphGapCommands.slice(0, 4))
		specs.push([/^re_runtime_adapter /i.test(command) ? "runtime-adapter" : "attack-graph", command]);
	for (const command of operatorFeedbackCommands.slice(0, 4)) specs.push(["operator-feedback", command]);
	for (const command of swarmRetryCommands.slice(0, 4)) specs.push(["swarm-retry", command]);
	return {
		specs,
		targetRuntimeCommands,
		sourceArtifactsMeta: {
			compactResumePath: compactResume.path,
			failureSignatureSourceArtifacts: failureSignaturePriority.sourceArtifacts,
			graphGapItems,
		},
	};
}
