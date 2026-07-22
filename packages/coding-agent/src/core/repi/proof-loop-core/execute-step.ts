/** Proof-loop step execution (phase dispatch, reverse run-first adapters). */

import type { ExtensionAPI } from "../../extensions/types.ts";
import { buildAutofixOutput } from "../autofix/output.ts";
import type { OperationExecution } from "../operator-step.ts";
import { executeOperatorStep } from "../operator-step-execute.ts";
import type { ProofLoopStep } from "../proof-loop-runtime.ts";
import {
	buildAttackGraphOutput,
	buildCompilerOutput,
	buildKnowledgeGraphOutput,
	buildOperatorOutput,
	buildVerifierOutput,
	operatorCommandConcrete,
	operatorStepPriority,
	runAutopilot,
	runReplayer,
} from "./deps.ts";
import { executeProofLoopReversePhase } from "./execute-step-reverse.ts";

export async function executeProofLoopStep(
	pi: ExtensionAPI,
	step: ProofLoopStep,
	target?: string,
	replaySteps = 2,
): Promise<OperationExecution> {
	const done = (output: string): OperationExecution => ({
		stepId: step.id,
		command: step.command,
		status: "done",
		output,
	});
	const blocked = (output: string): OperationExecution => ({
		stepId: step.id,
		command: step.command,
		status: "blocked",
		output,
	});
	if (step.status === "blocked") return blocked(step.reason ?? "proof loop step blocked");
	const reverse = await executeProofLoopReversePhase(pi, step, target, { done, blocked });
	if (reverse) return reverse;
	switch (step.phase) {
		case "compact-resume": {
			const concrete = operatorCommandConcrete(step.command, target);
			if (concrete.blocked) return blocked(concrete.blocked);
			if (/^re[-_]context\s+resume\b/i.test(concrete.command))
				return done(`compact resume context already verified by resume contract; command=${concrete.command}`);
			if (/^re[-_]operator\s+plan\b/i.test(concrete.command)) return done(buildOperatorOutput("plan", { target }));
			if (/^re[-_]proof[-_]loop\s+run\b/i.test(concrete.command))
				return done(`compact resume proof loop entered by current re_proof_loop run; command=${concrete.command}`);
			return executeOperatorStep(
				pi,
				{
					id: step.id,
					command: concrete.command,
					status: "ready",
					priority: operatorStepPriority(concrete.command),
					sourceArtifacts: step.sourceArtifacts,
				},
				target,
			);
		}
		case "operator-feedback":
		case "failure-signature":
		case "swarm-retry":
			return executeOperatorStep(
				pi,
				{
					id: step.id,
					command: step.command,
					status: "ready",
					priority: operatorStepPriority(step.command),
					sourceArtifacts: step.sourceArtifacts,
				},
				target,
			);
		case "attack-graph":
			return done(buildAttackGraphOutput("build"));
		case "verifier":
			return done(buildVerifierOutput("matrix", { target }));
		case "compiler": {
			const action = /\sfinal\b/i.test(step.command) ? "final" : "draft";
			return done(buildCompilerOutput(action, { target }));
		}
		case "replayer":
			return done(await runReplayer(pi, { target, maxSteps: replaySteps }));
		case "autofix": {
			const action = /\sapply\b/i.test(step.command) ? "apply" : "plan";
			return done(buildAutofixOutput(action, { target }));
		}
		case "case-memory": {
			const maxAutoSteps = /(?:^|\s)(\d+)\s*$/.exec(step.command)?.[1];
			const plan = await runAutopilot(pi, {
				action: "plan",
				target,
				maxAutoSteps: maxAutoSteps ? Number(maxAutoSteps) : 1,
				reasoning: "regex",
				dispatch: "inline",
				runAuto: false,
			});
			return done(`${plan}\ncase_memory_execution: deferred_to_re_autopilot_run`);
		}
		case "knowledge":
			return done(buildKnowledgeGraphOutput("build", { target }));
		default:
			return blocked(`unsupported proof loop phase: ${String(step.phase)}`);
	}
}
