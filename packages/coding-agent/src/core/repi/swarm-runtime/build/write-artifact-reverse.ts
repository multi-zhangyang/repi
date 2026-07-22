/** Swarm artifact reverse next seed. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { SwarmArtifact } from "../types.ts";

export function withSwarmArtifactReverseNext(swarm: SwarmArtifact): SwarmArtifact {
	const reverseBlob = `${swarm.route ?? ""} ${swarm.target ?? ""} ${(swarm.workers ?? []).map((w: any) => w.worker).join(" ")}`;
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			reverseBlob,
		)
	) {
		return swarm;
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: reverseBlob,
		target: swarm.target,
		includeGates: true,
	}).slice(0, 2);
	if (!reverseNext.length) return swarm;
	const next = Array.from(
		new Set([...(swarm.commanderNextActions ?? (swarm as any).nextActions ?? []), ...reverseNext]),
	).slice(0, 24);
	return {
		...swarm,
		commanderNextActions: next,
		nextActions: next,
	} as SwarmArtifact;
}
