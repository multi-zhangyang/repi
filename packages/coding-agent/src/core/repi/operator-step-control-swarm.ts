/** Operator control handlers: delegate/swarm/verifier/compiler. */
import type { ExtensionAPI } from "../extensions/types.ts";
import type { OperationExecution } from "./operator-step-deps.ts";
import { d } from "./operator-step-deps.ts";

type Done = (output: string) => OperationExecution;

export async function tryExecuteOperatorControlSwarm(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
): Promise<OperationExecution | undefined> {
	const delegateMatch = /^re[-_]delegate\s+(plan|show|merge)?(?:\s+(.+))?$/i.exec(command);
	if (delegateMatch)
		return done(
			d().buildDelegateOutput((delegateMatch[1] as "plan" | "show" | "merge") ?? "plan", {
				target: delegateMatch[2]?.trim() || target,
			}),
		);
	const swarmMatch = /^re[-_]swarm\s+(plan|show|run|merge)?(?:\s+(.+?))?(?:\s+(\d+))?(?:\s+(\d+))?$/i.exec(command);
	if (swarmMatch) {
		const action = (swarmMatch[1] as "plan" | "show" | "run" | "merge") ?? "plan";
		const swarmTarget = swarmMatch[2]?.trim() || target;
		const maxWorkers = swarmMatch[3] ? Number(swarmMatch[3]) : undefined;
		const maxCommands = swarmMatch[4] ? Number(swarmMatch[4]) : undefined;
		return done(
			action === "run"
				? await d().runSwarm(pi, { target: swarmTarget, maxWorkers, maxCommands })
				: d().buildSwarmOutput(action, { target: swarmTarget }),
		);
	}
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
	return undefined;
}
