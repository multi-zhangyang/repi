/** Operation reverse steps: verifier/compiler/replayer/autofix/proof-loop/knowledge. */
import type { ExtensionAPI } from "../extensions/types.ts";
import { d } from "./operation-step-deps.ts";
import type { OperationExecution } from "./operator-step.ts";

type Done = (output: string) => OperationExecution;

export async function tryExecuteOperationReverseProofStep(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
): Promise<OperationExecution | undefined> {
	const verifierMatch = /^re[-_]verifier\s+(check|show|matrix)?(?:\s+(.+))?$/i.exec(command);
	if (verifierMatch)
		return done(
			d().buildVerifierOutput((verifierMatch[1] as "check" | "show" | "matrix") ?? "check", {
				target: verifierMatch[2]?.trim() || target,
			}),
		);
	const compilerMatch = /^re[-_]compiler\s+(draft|show|final)?(?:\s+(.+))?$/i.exec(command);
	if (compilerMatch)
		return done(
			d().buildCompilerOutput((compilerMatch[1] as "draft" | "show" | "final") ?? "draft", {
				target: compilerMatch[2]?.trim() || target,
			}),
		);
	const replayerMatch = /^re[-_]replayer\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(command);
	if (replayerMatch) {
		const action = (replayerMatch[1] as "plan" | "show" | "run") ?? "run";
		const replayTarget = replayerMatch[2]?.trim() || target;
		const maxSteps = replayerMatch[3] ? Number(replayerMatch[3]) : undefined;
		return done(
			action === "run"
				? await d().runReplayer(pi, { target: replayTarget, maxSteps })
				: d().buildReplayerOutput(action, { target: replayTarget }),
		);
	}
	const autofixMatch = /^re[-_]autofix\s+(plan|show|apply)?(?:\s+(.+))?$/i.exec(command);
	if (autofixMatch)
		return done(
			d().buildAutofixOutput((autofixMatch[1] as "plan" | "show" | "apply") ?? "plan", {
				target: autofixMatch[2]?.trim() || target,
			}),
		);
	const proofLoopMatch = /^re[-_]proof[-_]loop\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+(\d+))?(?:\s+(\d+))?$/i.exec(
		command,
	);
	if (proofLoopMatch) {
		const action = (proofLoopMatch[1] as "plan" | "show" | "run") ?? "run";
		const loopTarget = proofLoopMatch[2]?.trim() || target;
		const maxSteps = proofLoopMatch[3] ? Number(proofLoopMatch[3]) : undefined;
		const replaySteps = proofLoopMatch[4] ? Number(proofLoopMatch[4]) : undefined;
		return done(
			action === "run"
				? await d().runProofLoop(pi, { target: loopTarget, maxSteps, replaySteps })
				: d().buildProofLoopOutput(action, { target: loopTarget, maxSteps, replaySteps }),
		);
	}
	const knowledgeMatch = /^re[-_]knowledge(?:[-_]graph)?\s+(build|show|query)?(?:\s+(.+))?$/i.exec(command);
	if (knowledgeMatch)
		return done(
			d().buildKnowledgeGraphOutput((knowledgeMatch[1] as "build" | "show" | "query") ?? "build", {
				target,
				query: knowledgeMatch[2]?.trim(),
			}),
		);
	return undefined;
}
