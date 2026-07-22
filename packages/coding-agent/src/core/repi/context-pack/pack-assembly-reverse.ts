/** Context-pack reverse next seeding. */
import { reverseDomainCaptureNextCommands } from "../reverse-capture.ts";

export function contextPackReverseNextCommands(input: {
	route?: string;
	target?: string;
	mission?: any;
	repairQueue?: any;
}): string[] {
	const reverseHeavy =
		/native|pwn|malware|firmware|reverse|binary|exploit|mobile|frontend|js|browser|authz|web|frida|proof_exit|bind_ready|pending_runtime_capture/i.test(
			`${input.route ?? ""} ${input.target ?? ""} ${JSON.stringify(input.mission?.route ?? {})} ${JSON.stringify(input.repairQueue ?? [])}`,
		);
	if (!reverseHeavy) return [];
	return reverseDomainCaptureNextCommands({
		routeOrBlob: `${input.route ?? ""} ${input.target ?? ""} ${JSON.stringify(input.mission ?? {})}`,
		target: input.target,
	}).slice(0, 4);
}
