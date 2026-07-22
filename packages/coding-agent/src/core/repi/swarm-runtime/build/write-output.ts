/** Swarm build output with reverse capture gate. */

import { parseSwarmArtifact } from "../../graph-artifacts.ts";
import { readTextFile as readText } from "../../storage.ts";
import { formatSwarm } from "../../swarm-format.ts";
import { truncateMiddle } from "../../text.ts";
import { refreshSwarmRunDerivedFields } from "../deps.ts";
import { buildSwarm } from "./compose.ts";
import { latestSwarmArtifactPath } from "./helpers.ts";
import { swarmReverseHasStrongCapture, swarmReverseHeavyBlob, swarmReverseNextCommands } from "./reverse.ts";
import { writeSwarmArtifact } from "./write-artifact.ts";

export function buildSwarmOutput(
	action: "plan" | "show" | "merge" = "plan",
	options: { target?: string; task?: string } = {},
): string {
	if (action === "show") {
		const path = latestSwarmArtifactPath();
		if (!path) return "swarm_plan:\nstatus: missing\nnext: re_swarm plan";
		return truncateMiddle(readText(path), 18000);
	}
	let swarm =
		action === "merge"
			? (() => {
					const latest = latestSwarmArtifactPath();
					const parsed = latest ? parseSwarmArtifact(latest) : undefined;
					return parsed
						? refreshSwarmRunDerivedFields({
								...parsed,
								timestamp: new Date().toISOString(),
								mode: "merge",
							})
						: undefined;
				})()
			: undefined;
	swarm ??= buildSwarm({ ...options, mode: action === "merge" ? "merge" : "plan" });
	const path = writeSwarmArtifact(swarm);
	const text = formatSwarm(swarm, path);
	const reverseHeavy = swarmReverseHeavyBlob(swarm);
	const hasStrong = swarmReverseHasStrongCapture(swarm);
	if (reverseHeavy && !hasStrong) {
		const reverseNext = swarmReverseNextCommands({
			routeOrBlob: JSON.stringify(swarm),
			target: swarm.target,
		});
		return [
			text,
			"",
			"reverse_runtime_capture_gate:",
			"- require proof.exit=partial_runtime_capture|runtime_capture_strong",
			"- require bind_ready=true before claim",
			...reverseNext.map((cmd: any) => `- next: ${cmd}`),
			swarm.reverseReleaseBlock ? `- release_block: ${swarm.reverseReleaseBlock}` : undefined,
		]
			.filter(Boolean)
			.join("\n");
	}
	return text;
}
