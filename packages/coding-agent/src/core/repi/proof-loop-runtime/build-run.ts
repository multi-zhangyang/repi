/** Proof-loop run with reverse domain next footer. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { buildProofLoop, refreshProofLoopCached, writeProofLoopArtifact } from "./build-core.ts";
import { finalizeProofLoopOutput } from "./build-run-footer.ts";
import { runProofLoopRepairPhases } from "./build-run-phases.ts";
import { createProofLoopRunHelpers } from "./build-run-steps.ts";
import { updateReconCompactionTelemetryFromExecutions } from "./deps.ts";
import { formatProofLoop } from "./format.ts";

export async function runProofLoop(
	pi: ExtensionAPI,
	options: { target?: string; maxSteps?: number; replaySteps?: number } = {},
): Promise<string> {
	const helpers = createProofLoopRunHelpers(buildProofLoop({ ...options, mode: "run" }));
	for (const step of helpers.proof.steps.filter(
		(item: any) => item.phase === "compact-resume" && item.status === "ready",
	)) {
		if (helpers.remaining <= 0) break;
		await helpers.runStep(pi, step, 1);
	}
	if (helpers.proof.executed.some((item: any) => /compact resume proof loop entered/i.test(item.output))) {
		updateReconCompactionTelemetryFromExecutions(helpers.proof.executed, helpers.proof.sourceArtifacts);
		helpers.proof = refreshProofLoopCached(helpers.proof);
		const path = writeProofLoopArtifact(helpers.proof);
		return formatProofLoop(helpers.proof, path);
	}
	await helpers.runQuickPath(pi);
	for (const id of ["proof:1:verifier", "proof:2:compiler", "proof:3:replayer"]) {
		const step = helpers.stepById(id);
		if (step) await helpers.runStep(pi, step, helpers.proof.replaySteps);
	}
	await runProofLoopRepairPhases(pi, helpers);
	const compactResumeExecution = helpers.proof.executed.some((execution: any) =>
		/compact resume/i.test(execution.output),
	);
	updateReconCompactionTelemetryFromExecutions(helpers.proof.executed, helpers.proof.sourceArtifacts);
	if (compactResumeExecution) helpers.proof = refreshProofLoopCached(helpers.proof);
	else if (helpers.proofDirty) helpers.pruneExecutedQuickCommands();
	return finalizeProofLoopOutput(helpers.proof, options);
}
