/** Swarm compose reverse domain next for reverse-heavy workers. */
import { reverseDomainCaptureNextCommands } from "../../reverse-capture.ts";
import type { SwarmWorkerRuntime } from "../types.ts";

export function composeSwarmReverseCommanderNext(workers: SwarmWorkerRuntime[], target?: string): string[] {
	const reverseBlob = workers
		.map((worker: any) => `${worker.worker} ${worker.objective} ${worker.commands.join(" ")}`)
		.join("\n");
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready|frida/i.test(
			reverseBlob,
		)
	) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: reverseBlob,
		target,
		includeGates: true,
	}).slice(0, 3);
}
