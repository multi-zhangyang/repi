/** Proof-loop bridge steps: delegate/swarm/supervisor. */

import type { ExtensionAPI } from "../../extensions/types.ts";
import type { OperationExecution } from "../operator-step.ts";
import { repiProofLoopCommandTarget as proofLoopCommandTarget } from "../proof-loop.ts";
import { buildSupervisorOutput } from "../supervisor/io.ts";
import { buildDelegateOutput, buildSwarmOutput } from "./deps.ts";

export async function executeProofLoopBridgeStep(
	_pi: ExtensionAPI,
	kind: "delegate" | "swarm" | "supervisor",
	target?: string,
	repairMode = false,
): Promise<OperationExecution> {
	const command =
		kind === "delegate"
			? `re_delegate plan${proofLoopCommandTarget(target)}`
			: kind === "swarm"
				? `re_swarm run${proofLoopCommandTarget(target)} 2 1 && re_swarm merge`
				: `re_supervisor ${repairMode ? "repair" : "review"}${proofLoopCommandTarget(target)}`;
	const output =
		kind === "delegate"
			? buildDelegateOutput("plan", { target })
			: kind === "swarm"
				? [
						buildSwarmOutput("plan", { target }),
						`proof_loop_bridge_command: re_swarm run${proofLoopCommandTarget(target)} 2 1`,
						"proof_loop_bridge_execution: deferred_to_re_swarm_run",
						buildSwarmOutput("merge", { target }),
					].join("\n\n")
				: await buildSupervisorOutput(repairMode ? "repair" : "review", { target });
	return {
		stepId: `proof:bridge:${kind}`,
		command,
		status: "done",
		output,
	};
}
