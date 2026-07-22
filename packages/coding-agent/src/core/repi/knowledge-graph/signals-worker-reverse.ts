/** Worker dispatcher reverse next routing hints. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function workerDispatcherReverseHints(params: {
	scoreboardLines?: string[];
	adaptiveRoutingHints?: string[];
}): string[] {
	return reverseDomainCaptureNextCommands({
		routeOrBlob: `${(params.scoreboardLines ?? []).join(" ")} ${(params.adaptiveRoutingHints ?? []).join(" ")} knowledge_worker`,
		includeGates: true,
	})
		.slice(0, 2)
		.map((cmd: any) => `reverse_next: ${cmd}`);
}
