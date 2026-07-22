/** Operator step handlers: mission/kernel/context/autopilot/swarm/control plane. */
import type { ExtensionAPI } from "../extensions/types.ts";
import { tryExecuteOperatorControlCore } from "./operator-step-control-core.ts";
import { tryExecuteOperatorControlSwarm } from "./operator-step-control-swarm.ts";
import type { OperationExecution } from "./operator-step-deps.ts";

// Landmark: re[-_]mission / re[-_]swarm / re[-_]operator (body in operator-step-control-core/swarm.ts)

type Done = (output: string) => OperationExecution;
type Blocked = (output: string) => OperationExecution;

export async function tryExecuteOperatorControlStep(
	pi: ExtensionAPI,
	command: string,
	target: string | undefined,
	done: Done,
	_blocked: Blocked,
): Promise<OperationExecution | undefined> {
	return (
		(await tryExecuteOperatorControlCore(pi, command, target, done)) ??
		(await tryExecuteOperatorControlSwarm(pi, command, target, done))
	);
}
