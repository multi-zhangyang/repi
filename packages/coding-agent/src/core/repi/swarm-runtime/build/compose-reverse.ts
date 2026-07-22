/** Swarm compose reverse capture finalize. */
import type { SwarmArtifact } from "../types.ts";
import { swarmReverseHeavyBlob, swarmReverseNextCommands } from "./reverse.ts";

export function finalizeSwarmReverseGates(swarm: SwarmArtifact): SwarmArtifact {
	const reverseHeavy = swarmReverseHeavyBlob({
		workers: swarm.workers,
		plan: swarm.parallelPlan,
		evidence: swarm.evidenceContract,
	} as any);
	if (!reverseHeavy) return swarm;
	const reverseNext = swarmReverseNextCommands({
		routeOrBlob: JSON.stringify({
			workers: swarm.workers,
			plan: swarm.parallelPlan,
			evidence: swarm.evidenceContract,
		}),
		target: swarm.target,
	});
	return {
		...swarm,
		reverseNextCommands: reverseNext,
		reverseReleaseBlock: "blocked_until_runtime_capture_and_bind_ready",
		commanderNextActions: Array.from(new Set([...(swarm.commanderNextActions ?? []), ...reverseNext])).slice(0, 24),
	} as SwarmArtifact;
}
