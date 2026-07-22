/** Proof-loop phase sequencing after quick path. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { refreshProofLoopCached } from "./build-core.ts";
import { executeProofLoopBridgeStep } from "./deps.ts";

export async function runProofLoopRepairPhases(
	pi: ExtensionAPI,
	helpers: {
		proof: any;
		remaining: number;
		proofDirty: boolean;
		runStep: (pi: ExtensionAPI, step: any, replaySteps?: number) => Promise<void>;
		stepById: (id: string) => any;
	},
): Promise<void> {
	let { proof } = helpers;
	const runPhase = async (predicate: (item: any) => boolean, replay = 1) => {
		for (const step of proof.steps.filter((item: any) => predicate(item) && item.status === "ready")) {
			if (helpers.remaining <= 0) break;
			await helpers.runStep(pi, step, replay);
			proof = helpers.proof;
		}
	};
	if (
		(proof.verdict === "needs_repair" || proof.verdict === "partial") &&
		proof.caseMemoryLanePlan?.migrations.length &&
		helpers.remaining > 0
	) {
		await runPhase((item: any) => item.phase === "case-memory", 1);
		proof = helpers.proof;
	}
	if (
		(proof.verdict === "needs_repair" || proof.verdict === "partial") &&
		proof.operatorFeedbackQueue.length > 0 &&
		helpers.remaining > 0
	) {
		await runPhase((item: any) => item.phase === "operator-feedback", 1);
		proof = helpers.proof;
	}
	if (
		(proof.verdict === "needs_repair" || proof.verdict === "partial") &&
		proof.swarmRetryQueue.length > 0 &&
		helpers.remaining > 0
	) {
		await runPhase((item: any) => item.phase === "swarm-retry", 1);
		proof = helpers.proof;
	}
	if (
		(proof.verdict === "needs_repair" || proof.verdict === "partial") &&
		proof.specialistQueue.length > 0 &&
		helpers.remaining > 0
	) {
		for (const kind of ["delegate", "swarm", "supervisor"] as const) {
			if (helpers.remaining <= 0) break;
			const result = await executeProofLoopBridgeStep(pi, kind, proof.target, proof.verdict === "needs_repair");
			helpers.proof.executed.push(result);
			helpers.remaining -= 1;
			helpers.proof = refreshProofLoopCached(helpers.proof);
			helpers.proofDirty = false;
			proof = helpers.proof;
		}
	}
	if (proof.verdict === "needs_repair") {
		for (const id of ["proof:4:autofix", "proof:5:autofix", "proof:6:replayer"]) {
			const step = helpers.stepById(id);
			if (step) await helpers.runStep(pi, step, id === "proof:6:replayer" ? 1 : proof.replaySteps);
		}
		proof = helpers.proof;
	}
	if (proof.verdict === "ready") {
		for (const id of ["proof:7:compiler", "proof:8:knowledge", "proof:9:completion"]) {
			const step = helpers.stepById(id);
			if (step) await helpers.runStep(pi, step, proof.replaySteps);
		}
	}
}
