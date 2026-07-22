/** Proof-loop step/quick-path execution helpers. */
import type { ExtensionAPI } from "../../extensions/types.ts";
import { markProofLoopStepForCommand } from "../proof-loop-core/execute-quick.ts";
import { refreshProofLoopCached } from "./build-core.ts";
import { executeProofLoopQuickPathCommand, executeProofLoopStep } from "./deps.ts";
import type { ProofLoopStep } from "./types.ts";

export function createProofLoopRunHelpers(initialProof: any) {
	let proof = initialProof;
	let remaining = proof.maxSteps;
	let proofDirty = false;
	const executedCommands = new Set<string>();
	const normalizeExecutedCommand = (command: string) => command.trim().replace(/\s+/g, " ");
	const pruneExecutedQuickCommands = () => {
		proof.quickPath = proof.quickPath.filter(
			(command: string) => !executedCommands.has(normalizeExecutedCommand(command)),
		);
		proof.nextActions = proof.nextActions.filter(
			(command: string) => !executedCommands.has(normalizeExecutedCommand(command)),
		);
	};
	const runStep = async (pi: ExtensionAPI, step: ProofLoopStep, replaySteps = proof.replaySteps) => {
		if (remaining <= 0) return;
		const result = await executeProofLoopStep(pi, step, proof.target, replaySteps);
		proof.executed.push(result);
		executedCommands.add(normalizeExecutedCommand(result.command));
		step.status = result.status === "blocked" ? "blocked" : "done";
		step.reason = result.status === "blocked" ? result.output : step.reason;
		remaining -= 1;
		proof = refreshProofLoopCached(proof);
		proofDirty = false;
	};
	const runQuickPath = async (pi: ExtensionAPI) => {
		const quickCommands = proof.quickPath.filter((command: string) => !/^re[-_]proof[-_]loop\s+run\b/i.test(command));
		let touched = false;
		for (const [index, command] of quickCommands.entries()) {
			if (remaining <= 0) break;
			const normalized = normalizeExecutedCommand(command);
			if (!normalized || executedCommands.has(normalized)) continue;
			const result = await executeProofLoopQuickPathCommand(pi, proof, command, index);
			proof.executed.push(result);
			executedCommands.add(normalized);
			markProofLoopStepForCommand(proof, command, result);
			remaining -= 1;
			touched = true;
		}
		if (touched) pruneExecutedQuickCommands();
		if (touched && remaining > 0) {
			proof = refreshProofLoopCached(proof);
			proofDirty = false;
		} else if (touched) {
			proofDirty = true;
		}
	};
	const stepById = (id: string) => proof.steps.find((step: any) => step.id === id && step.status === "ready");
	return {
		get proof() {
			return proof;
		},
		set proof(value: any) {
			proof = value;
		},
		get remaining() {
			return remaining;
		},
		set remaining(value: number) {
			remaining = value;
		},
		get proofDirty() {
			return proofDirty;
		},
		set proofDirty(value: boolean) {
			proofDirty = value;
		},
		runStep,
		runQuickPath,
		stepById,
		pruneExecutedQuickCommands,
	};
}
