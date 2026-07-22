/** Knowledge-graph reverse routing hint seed. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function knowledgeGraphReverseRoutingHints(params: {
	route?: string;
	target?: string;
	missionTask?: string;
	allTags?: string[];
}): string[] {
	const reverseBlob = `${params.route ?? ""} ${params.target ?? ""} ${params.missionTask ?? ""} ${(params.allTags ?? []).join(" ")}`;
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			reverseBlob,
		)
	) {
		return [];
	}
	return reverseDomainCaptureNextCommands({
		routeOrBlob: reverseBlob,
		target: params.target,
		includeGates: true,
	})
		.slice(0, 3)
		.map((cmd: any) => `reverse_next: ${cmd}`);
}
