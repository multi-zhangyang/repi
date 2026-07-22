/** Swarm format next command (reverse-aware). */
import { reverseDomainCaptureNextCommands } from "./reverse-capture.ts";
import type { SwarmFormatView } from "./swarm-format-types.ts";

export function swarmFormatNextCommand(swarm: SwarmFormatView): string {
	if (swarm.mode === "merge") return "re_supervisor review";
	if (swarm.mode === "run") return "re_swarm merge";
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready/i.test(
			`${swarm.route ?? ""} ${swarm.target ?? ""} ${(swarm.commanderNextActions ?? []).join(" ")}`,
		);
	if (reverseHeavy) {
		return (
			reverseDomainCaptureNextCommands({
				routeOrBlob: `${swarm.route ?? ""} ${swarm.target ?? ""}`,
				target: swarm.target,
			})[0] ?? `re_swarm run ${swarm.target ?? "<target>"} 3 1`
		);
	}
	return `re_swarm run ${swarm.target ?? "<target>"} 3 1`;
}
