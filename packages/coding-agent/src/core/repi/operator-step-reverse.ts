/** Operator step handlers: reverse runtime tools (run-first defaults). */
import type { ExtensionAPI } from "../extensions/types.ts";
import type { OperationExecution } from "./operator-step-deps.ts";
import { d } from "./operator-step-deps.ts";

type Done = (output: string) => OperationExecution;

export async function tryExecuteOperatorReverseStep(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
): Promise<OperationExecution | undefined> {
	const webAuthzStateMatch = /^re[-_]web[-_]authz[-_]state\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(
		command,
	);
	if (webAuthzStateMatch) {
		const action = (webAuthzStateMatch[1] as "plan" | "show" | "run") ?? "run";
		const authzTarget = webAuthzStateMatch[2]?.trim() || target;
		const timeoutMs = webAuthzStateMatch[3] ? Number(webAuthzStateMatch[3]) : undefined;
		return done(
			action === "run"
				? await d().runWebAuthzState(pi, { target: authzTarget, timeoutMs })
				: d().buildWebAuthzStateOutput(action, { target: authzTarget, timeoutMs }),
		);
	}
	const mobileRuntimeMatch =
		/^re[-_]mobile[-_]runtime\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+([A-Za-z][\w]*(?:\.[A-Za-z][\w]*){1,}))?(?:\s+(\d+))?$/i.exec(
			command,
		);
	if (mobileRuntimeMatch) {
		const action = (mobileRuntimeMatch[1] as "plan" | "show" | "run") ?? "run";
		const mobileTarget = mobileRuntimeMatch[2]?.trim() || target;
		const packageName = mobileRuntimeMatch[3]?.trim();
		const timeoutMs = mobileRuntimeMatch[4] ? Number(mobileRuntimeMatch[4]) : undefined;
		return done(
			action === "run"
				? await d().runMobileRuntime(pi, { target: mobileTarget, packageName, timeoutMs })
				: d().buildMobileRuntimeOutput(action, { target: mobileTarget, packageName, timeoutMs }),
		);
	}
	const nativeRuntimeMatch = /^re[-_]native[-_]runtime\s+(plan|show|run)?(?:\s+(.+?))?(?:\s+(\d+))?$/i.exec(command);
	if (nativeRuntimeMatch) {
		const action = (nativeRuntimeMatch[1] as "plan" | "show" | "run") ?? "run";
		const nativeTarget = nativeRuntimeMatch[2]?.trim() || target;
		const timeoutMs = nativeRuntimeMatch[3] ? Number(nativeRuntimeMatch[3]) : undefined;
		return done(
			action === "run"
				? await d().runNativeRuntime(pi, { target: nativeTarget, timeoutMs })
				: d().buildNativeRuntimeOutput(action, { target: nativeTarget, timeoutMs }),
		);
	}
	const exploitLabMatch =
		/^re[-_]exploit[-_]lab\s+(plan|show|run|bundle)?(?:\s+(.+?))?(?:\s+(\d+))?(?:\s+(\d+))?$/i.exec(command);
	if (exploitLabMatch) {
		const action = (exploitLabMatch[1] as "plan" | "show" | "run" | "bundle") ?? "run";
		const labTarget = exploitLabMatch[2]?.trim() || target;
		const runs = exploitLabMatch[3] ? Number(exploitLabMatch[3]) : undefined;
		const timeoutMs = exploitLabMatch[4] ? Number(exploitLabMatch[4]) : undefined;
		return done(
			action === "run"
				? await d().runExploitLab(pi, { target: labTarget, runs, timeoutMs })
				: d().buildExploitLabOutput(action, { target: labTarget, runs, timeoutMs }),
		);
	}
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
