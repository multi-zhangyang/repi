/** Context-pack assemble reverse next merge. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function mergeAssembleContextPackReverseNext(params: {
	route?: string;
	target?: string;
	baseNextCommands: string[];
}): string[] {
	const reverseBlob = `${params.route ?? ""} ${params.target ?? ""} ${params.baseNextCommands.join(" ")}`;
	if (
		!/native|pwn|malware|firmware|reverse|binary|exploit|mobile|js|browser|authz|web|proof_exit|bind_ready/i.test(
			reverseBlob,
		)
	) {
		return params.baseNextCommands;
	}
	const reverseNext = reverseDomainCaptureNextCommands({
		routeOrBlob: reverseBlob,
		target: params.target,
		includeGates: true,
	}).slice(0, 2);
	return Array.from(new Set([...reverseNext, ...params.baseNextCommands])).slice(0, 24);
}
